import { Client } from '@opensearch-project/opensearch'
import { ClusterConfig } from '../types/cluster'
import { tunnelManager } from './tunnel-manager'
import { ApiError } from './errors/api-error'
import { decrypt } from './utils/crypto'

class OpenSearchClient {
  private static instances: Map<string, OpenSearchClient> = new Map()
  private client: Client
  private retryCount: number = 2
  private retryDelay: number = 100

  private constructor(config: ClusterConfig) {
    let nodeUrl = config.url

    // 如果启用了 SSH 隧道，使用本地转发端口
    if (config.sshEnabled) {
      const localUrl = new URL(config.url)
      localUrl.hostname = '127.0.0.1'
      // 获取实际分配的端口
      const actualPort = tunnelManager.getActualPort(config.id)
      if (!actualPort) {
        throw new Error('Failed to get tunnel port')
      }
      localUrl.port = actualPort.toString()
      nodeUrl = localUrl.toString()
    }

    // 创建客户端时不打印敏感信息
    console.log('Creating OpenSearch client:', {
      node: nodeUrl,
      auth: config.username && config.password ? {
        username: config.username,
        password: '***'
      } : 'Not provided'
    })

    let auth: { username: string; password: string } | undefined = undefined

    if (config.username && config.password) {
      try {
        const decryptedPassword = decrypt(config.password)
        auth = {
          username: config.username,
          password: decryptedPassword,
        }
      } catch (error) {
        console.error('Failed to decrypt OpenSearch password:', error)
        throw new ApiError('Failed to decrypt OpenSearch password', 500)
      }
    }

    this.client = new Client({
      node: nodeUrl,
      auth,
      ssl: {
        rejectUnauthorized: false,
        requestCert: true,
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.3'
      },
      requestTimeout: 60000, 
      sniffOnStart: false,
      sniffOnConnectionFault: false,
      resurrectStrategy: 'ping',
      maxRetries: 3,
      compression: 'gzip',
    })
  }

  public static async getInstance(config: ClusterConfig): Promise<OpenSearchClient> {
    const key = `${config.id}-${config.url}-${config.username}`

    try {
      // 如果启用了 SSH 隧道，先创建隧道
      if (config.sshEnabled && config.id && config.sshHost && config.sshUser) {
        try {
          await tunnelManager.createTunnel(config.id, {
            sshHost: config.sshHost,
            sshPort: config.sshPort || 22,
            sshUser: config.sshUser,
            sshPassword: config.sshPassword || undefined,
            sshKeyFile: config.sshKeyFile || undefined,
            localPort: config.localPort || 9300,
            clusterUrl: config.url
          })
        } catch (error: any) {
          console.error('Failed to create SSH tunnel:', error)
          throw new ApiError(
            `Failed to create SSH tunnel: ${error.message}`,
            500,
            error
          )
        }

        // 增加延迟，等待隧道完全建立
        await new Promise(resolve => setTimeout(resolve, 10000))
      }

      if (!OpenSearchClient.instances.has(key)) {
        const instance = new OpenSearchClient(config)
        // 测试连接
        try {
          // 使用更长的超时时间进行健康检查
          await instance.client.cluster.health({
            timeout: '30s', // 设置更长的健康检查超时
            wait_for_status: 'yellow', // 只需要等待集群至少为黄色状态
          })
          OpenSearchClient.instances.set(key, instance)
        } catch (error) {
          console.error('Failed to connect to OpenSearch: ' + config.name, error)
          // 如果是SSH隧道连接，关闭隧道
          if (config.sshEnabled && config.id) {
            await tunnelManager.closeTunnel(config.id)
          }
          throw new ApiError(
            'Failed to connect to OpenSearch cluster: ' + config.name,
            500,
            error
          )
        }
      }

      return OpenSearchClient.instances.get(key)!
    } catch (error) {
      // 如果出错，清理隧道
      if (config.sshEnabled && config.id) {
        await tunnelManager.closeTunnel(config.id)
      }
      throw error instanceof ApiError ? error : new ApiError(
        'Failed to create OpenSearch client',
        500,
        error
      )
    }
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    customErrorMessage?: string
  ): Promise<T> {
    let lastError: Error | null = null

    for (let i = 0; i < this.retryCount; i++) {
      try {
        const result = await operation()
        return result ?? {} as T
      } catch (error) {
        console.error(`Operation failed (attempt ${i + 1}/${this.retryCount}):`, error)
        lastError = error as Error
        if (i < this.retryCount - 1) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, i)))
        }
      }
    }

    throw new ApiError(
      customErrorMessage || 'Operation failed after retries',
      500,
      lastError
    )
  }

  public async executeQuery(params: {
    method: string,
    path: string,
    body?: any
  }) {
    return this.withRetry(async () => {
      const { method, path, body } = params
      console.log('Executing query:', { method, path, body })

      // 移除路径开头的斜杠
      const cleanPath = path.startsWith('/') ? path.slice(1) : path

      try {
        // 使用低级 API 直接发送请求
        const response = await this.client.transport.request({
          method,
          path: `/${cleanPath}`,
          body,
        })
        return response.body
      } catch (error) {
        console.error('Query error:', error)
        throw error
      }
    }, 'Failed to execute query')
  }

  public async listIndices() {
    return this.withRetry(async () => {
      const response = await this.client.cat.indices({
        format: "json",
        bytes: "b",
        v: true,
        h: "health,status,index,uuid,pri,rep,docs.count,docs.deleted,store.size,pri.store.size",
        expand_wildcards: "all"
      })
      return Array.isArray(response.body) ? response.body : []
    }, 'Failed to list indices')
  }

  public async createIndex(name: string, options: {
    settings: {
      number_of_shards: number;
      number_of_replicas: number;
      refresh_interval?: string;
    };
    mappings?: Record<string, any>;
  }) {
    return this.withRetry(async () => {
      const response = await this.client.indices.create({
        index: name,
        body: {
          settings: options.settings,
          mappings: options.mappings,
        },
      })
      return response.body
    }, 'Failed to create index')
  }

  public async getClusterHealth() {
    return this.withRetry(async () => {
      const response = await this.client.cluster.health()
      return {
        status: response.body?.status ?? 'red',
        cluster_name: response.body?.cluster_name ?? 'unknown',
        number_of_nodes: response.body?.number_of_nodes ?? 0,
        active_shards: response.body?.active_shards ?? 0,
        relocating_shards: response.body?.relocating_shards ?? 0,
        initializing_shards: response.body?.initializing_shards ?? 0,
        unassigned_shards: response.body?.unassigned_shards ?? 0,
        version: response.body?.version ?? 'unknown',
      }
    }, 'Failed to get cluster health')
  }

  public async getClusterStats() {
    return this.withRetry(async () => {
      const [stats, indices] = await Promise.all([
        this.client.cluster.stats(),
        this.client.cat.indices({ format: 'json', bytes: 'b' })
      ])

      // 计算所有索引的总文档数和存储大小
      const totalDocs = Array.isArray(indices.body) ?
        indices.body.reduce((sum, index) => sum + (parseInt(index['docs.count'] || '0')), 0) : 0

      const totalSize = Array.isArray(indices.body) ?
        indices.body.reduce((sum, index) => sum + (parseInt(index['store.size'] || '0')), 0) : 0
      return {
        indices: {
          count: stats.body?.indices?.count ?? 0,
          docs: {
            count: totalDocs,
          },
          store: {
            size_in_bytes: totalSize,
            total_data_set_size_in_bytes: totalSize,
          },
        },
        nodes: {
          count: stats.body?.nodes?.count?.total ?? 0,
          versions: stats.body?.nodes?.versions ?? [],
        },
      }
    }, 'Failed to get cluster stats')
  }

  public async updateIndexSettings(indexName: string, settings: any) {
    try {
      const response = await this.client.indices.putSettings({
        index: indexName,
        body: settings,
      })
      return response.body
    } catch (error) {
      throw new ApiError('Failed to update index settings', 500, error)
    }
  }

  public async testConnection(timeout: number = 5000): Promise<boolean> {
    return this.withRetry(async () => {
      try {
        const response = await this.client.cluster.health({
          timeout: `${timeout}ms`,
        })
        return response.statusCode === 200
      } catch (error) {
        console.error('Connection test failed:', error)
        return false
      }
    }, 'Failed to test connection')
  }

  public async getNodes() {
    return this.withRetry(async () => {
      const response = await this.client.nodes.info()
      return response.body
    }, 'Failed to get nodes info')
  }

  public async deleteIndex(name: string) {
    return this.withRetry(async () => {
      const response = await this.client.indices.delete({
        index: name,
      })
      return response.body
    }, 'Failed to delete index')
  }

  public async openIndex(name: string) {
    return this.withRetry(async () => {
      const response = await this.client.indices.open({
        index: name,
      })
      return response.body
    }, 'Failed to open index')
  }

  public async closeIndex(name: string) {
    return this.withRetry(async () => {
      const response = await this.client.indices.close({
        index: name,
      })
      return response.body
    }, 'Failed to close index')
  }

  public async getIndexSettings(name: string) {
    return this.withRetry(async () => {
      const response = await this.client.indices.getSettings({
        index: name,
        include_defaults: true,
      })
      return response.body
    }, 'Failed to get index settings')
  }

  public async getIndexMappings(name: string) {
    return this.withRetry(async () => {
      const response = await this.client.indices.getMapping({
        index: name,
      })
      return response.body
    }, 'Failed to get index mappings')
  }

  public async getIndexStats(name: string) {
    return this.withRetry(async () => {
      const response = await this.client.indices.stats({
        index: name,
        metric: '_all'  // 获取所有指标
      })

      // 确保返回正确的数据结构
      const indexStats = response.body.indices[name]
      if (!indexStats) {
        return {
          _all: {
            primaries: {
              docs: { count: 0, deleted: 0 },
              store: { size_in_bytes: 0 }
            },
            total: {
              docs: { count: 0, deleted: 0 },
              store: { size_in_bytes: 0 }
            }
          },
          _shards: {
            total: 0,
            successful: 0,
            failed: 0
          }
        }
      }

      return {
        _all: {
          primaries: {
            docs: indexStats.primaries.docs,
            store: indexStats.primaries.store
          },
          total: {
            docs: indexStats.total.docs,
            store: indexStats.total.store
          }
        },
        _shards: response.body._shards
      }
    }, 'Failed to get index stats')
  }

  public async getIndexMapping(indexName: string) {
    return this.withRetry(async () => {
      const response = await this.client.indices.getMapping({
        index: indexName
      })
      const mapping = response.body[indexName]?.mappings?.properties
      if (!mapping) {
        console.log('No mapping found, using empty mapping')
        return {}
      }

      // 忽略 _ 开头的字段
      return Object.fromEntries(
        Object.entries(mapping).filter(([key]) => !key.startsWith('_'))
      )
    }, 'Failed to get index mapping')
  }

  // 根据 mapping 生成示例文档
  private generateDocumentTemplate(mapping: Record<string, any>): Record<string, any> {
    const template: Record<string, any> = {}

    for (const [field, config] of Object.entries(mapping)) {
      if (config.type === 'object' && config.properties) {
        template[field] = this.generateDocumentTemplate(config.properties)
      } else if (config.type === 'nested' && config.properties) {
        template[field] = [this.generateDocumentTemplate(config.properties)]
      } else {
        // 根据字段类型生成示例值
        switch (config.type) {
          case 'text':
          case 'keyword':
            template[field] = `示例${field}`
            break
          case 'long':
          case 'integer':
          case 'short':
          case 'byte':
            template[field] = 0
            break
          case 'double':
          case 'float':
            template[field] = 0.0
            break
          case 'boolean':
            template[field] = false
            break
          case 'date':
            template[field] = new Date().toISOString()
            break
          default:
            template[field] = null
        }
      }
    }

    console.log('Generated template:', template)
    return template
  }

  public async generateIndexTemplate(indexName: string) {
    try {
      const mapping = await this.getIndexMapping(indexName)
      const template = this.generateDocumentTemplate(mapping)
      return {
        success: true,
        data: template
      }
    } catch (error) {
      console.error('Failed to generate template:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate template'
      }
    }
  }

  public async getClusterSettings(params?: { include_defaults?: boolean, flat_settings?: boolean }) {
    return this.withRetry(async () => {
      const response = await this.client.cluster.getSettings({
        include_defaults: params?.include_defaults,
        flat_settings: params?.flat_settings,
      })

      return {
        persistent: response.body?.persistent || {},
        transient: response.body?.transient || {},
        defaults: response.body?.defaults || {}
      }
    }, 'Failed to get cluster settings')
  }

  public async putIndexMappings(indexName: string, mappings: Record<string, any>) {
    return this.withRetry(async () => {
      try {
        const response = await this.client.indices.putMapping({
          index: indexName,
          body: mappings,
        })
        return response.body
      } catch (error: any) {
        // 处理特定的错误类型
        if (error.body?.error?.type === 'illegal_argument_exception') {
          throw new ApiError(
            'Invalid mapping configuration',
            400,
            error.body.error.reason
          )
        }
        if (error.body?.error?.type === 'mapper_parsing_exception') {
          throw new ApiError(
            'Mapping parse error',
            400,
            error.body.error.reason
          )
        }
        throw error
      }
    }, 'Failed to update index mappings')
  }

  public async reindexWithNewMapping(
    sourceIndex: string,
    targetIndex: string,
    newMappings: Record<string, any>
  ) {
    return this.withRetry(async () => {
      // 1. 创建新索引
      await this.client.indices.create({
        index: targetIndex,
        body: {
          mappings: newMappings
        }
      })

      // 2. 重建索引
      await this.client.reindex({
        body: {
          source: {
            index: sourceIndex
          },
          dest: {
            index: targetIndex
          }
        }
      })

      // 3. 删除旧索引
      await this.client.indices.delete({
        index: sourceIndex
      })

      // 4. 创建别名（可选）
      await this.client.indices.putAlias({
        index: targetIndex,
        name: sourceIndex
      })

      return true
    }, 'Failed to reindex with new mapping')
  }
}

export { OpenSearchClient }