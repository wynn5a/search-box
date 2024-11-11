import { Client } from '@opensearch-project/opensearch'
import { ClusterConfig } from '@/types/cluster'
import { tunnelManager } from './tunnel-manager'
import { ApiError } from './errors/api-error'

class OpenSearchClient {
  private static instances: Map<string, OpenSearchClient> = new Map()
  private client: Client
  private clusterId: string
  private retryCount: number = 3
  private retryDelay: number = 1000

  private constructor(config: ClusterConfig) {
    this.clusterId = config.id || ''
    let nodeUrl = config.url

    // 如果启用了 SSH 隧道，使用本地转发端口
    if (config.sshEnabled && config.localPort) {
      const localUrl = new URL(config.url)
      localUrl.hostname = '127.0.0.1'
      localUrl.port = config.localPort.toString()
      nodeUrl = localUrl.toString()
    }

    this.client = new Client({
      node: nodeUrl,
      auth: config.username ? {
        username: config.username,
        password: config.password || '',
      } : undefined,
      ssl: {
        rejectUnauthorized: false,
      },
      requestTimeout: 30000,
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
        await tunnelManager.createTunnel(config.id, {
          sshHost: config.sshHost,
          sshPort: config.sshPort || 22,
          sshUser: config.sshUser,
          sshPassword: config.sshPassword || undefined,
          sshKeyFile: config.sshKeyFile || undefined,
          localPort: config.localPort || 9200,
          remoteHost: config.remoteHost || 'localhost',
          remotePort: config.remotePort || 9200,
        })

        // 添加延迟，等待隧道完全建立
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      if (!OpenSearchClient.instances.has(key)) {
        OpenSearchClient.instances.set(key, new OpenSearchClient(config))
      }
      
      return OpenSearchClient.instances.get(key)!
    } catch (error) {
      // 如果出错，清理隧道
      if (config.sshEnabled && config.id) {
        await tunnelManager.closeTunnel(config.id)
      }
      throw new ApiError('Failed to create OpenSearch client', 500, error)
    }
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    customErrorMessage?: string
  ): Promise<T> {
    let lastError: Error | null = null
    
    for (let i = 0; i < this.retryCount; i++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        if (i < this.retryCount - 1) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (i + 1)))
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
    index: string, 
    method: string, 
    path: string, 
    body?: any 
  }) {
    return this.withRetry(async () => {
      // 处理特殊的 API 路径
      switch (params.path) {
        case '/_mapping':
          const mappingResponse = await this.client.indices.getMapping({
            index: params.index
          })
          return mappingResponse.body[params.index]

        case '/_settings':
          const settingsResponse = await this.client.indices.getSettings({
            index: params.index,
            include_defaults: true
          })
          return settingsResponse.body[params.index]

        case '/_stats':
          const statsResponse = await this.client.indices.stats({
            index: params.index
          })
          return statsResponse.body.indices[params.index]

        case '/_search':
          return await this.client.search({ 
            index: params.index,
            body: params.body
          })

        default:
          if (params.path.startsWith('/_doc/')) {
            const id = params.path.replace('/_doc/', '')
            switch (params.method) {
              case 'GET':
                return await this.client.get({ index: params.index, id })
              case 'DELETE':
                return await this.client.delete({ index: params.index, id })
              case 'PUT':
                return await this.client.index({ 
                  index: params.index,
                  id,
                  body: params.body
                })
            }
          }
          // 默认执行搜索
          return await this.client.search({ 
            index: params.index,
            body: params.body
          })
      }
    }, 'Failed to execute query')
  }

  public async listIndices() {
    return this.withRetry(async () => {
      const response = await this.client.cat.indices({
        format: "json",
        bytes: "b",
        h: "health,status,index,uuid,pri,rep,docs.count,docs.deleted,store.size,pri.store.size",
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
        nodes: stats.body?.nodes ?? {
          count: 0,
          versions: [],
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

  public async testConnection(timeout: number = 10000): Promise<boolean> {
    try {
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), timeout)
      })

      const healthCheckPromise = this.client.cluster.health({
        timeout: `${timeout}ms`,
        wait_for_status: 'yellow',
        level: 'cluster',
      }).then(() => true)
      .catch((error) => {
        console.error('Connection test failed:', error)
        return false
      })

      // 使用 Promise.race 来处理超时
      const result = await Promise.race([
        healthCheckPromise,
        timeoutPromise
      ])

      return result
    } catch (error) {
      console.error('Connection test error:', error)
      return false
    }
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
      })
      return response.body
    }, 'Failed to get index stats')
  }
}

export { OpenSearchClient }