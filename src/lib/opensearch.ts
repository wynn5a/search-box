import { Client } from '@opensearch-project/opensearch'
import { ClusterConfig } from '@/types/cluster'

class OpenSearchClient {
  private static instances: Map<string, OpenSearchClient> = new Map()
  private client: Client

  private constructor(config: Partial<ClusterConfig>) {
    this.client = new Client({
      node: config.url,
      auth: config.username ? {
        username: config.username,
        password: config.password || '',
      } : undefined,
      ssl: {
        rejectUnauthorized: false,
      },
    })
  }

  public static getInstance(config: Partial<ClusterConfig>): OpenSearchClient {
    const key = `${config.url}-${config.username}`
    if (!OpenSearchClient.instances.has(key)) {
      OpenSearchClient.instances.set(key, new OpenSearchClient(config))
    }
    return OpenSearchClient.instances.get(key)!
  }

  public async getClusterHealth() {
    try {
      const response = await this.client.cluster.health()
      return response.body || {}
    } catch (error) {
      console.error('Error getting cluster health:', error)
      return {
        status: 'red',
        number_of_nodes: 0,
        active_shards: 0,
        relocating_shards: 0,
        initializing_shards: 0,
        unassigned_shards: 0,
      }
    }
  }

  public async getClusterStats() {
    try {
      const response = await this.client.cluster.stats()
      return response.body || {}
    } catch (error) {
      console.error('Error getting cluster stats:', error)
      return {
        indices: {
          count: 0,
          docs: {
            count: 0,
          },
          store: {
            size_in_bytes: 0,
          },
        },
      }
    }
  }

  public async getNodes() {
    try {
      const response = await this.client.nodes.info()
      return response.body || {}
    } catch (error) {
      console.error('Error getting nodes info:', error)
      return {
        nodes: {},
      }
    }
  }

  public async testConnection() {
    try {
      await this.client.cluster.health()
      return true
    } catch (error) {
      return false
    }
  }

  public async listIndices() {
    try {
      const response = await this.client.cat.indices({
        format: "json",
        bytes: "b",
        h: "health,status,index,uuid,pri,rep,docs.count,docs.deleted,store.size,pri.store.size",
      })
      return Array.isArray(response.body) ? response.body : []
    } catch (error) {
      console.error('Error listing indices:', error)
      return []
    }
  }

  public async createIndex(name: string, settings: any) {
    try {
      const response = await this.client.indices.create({
        index: name,
        body: {
          settings: settings,
        },
      })
      return response.body
    } catch (error) {
      console.error('Error creating index:', error)
      throw error
    }
  }

  public async deleteIndex(name: string) {
    try {
      const response = await this.client.indices.delete({
        index: name,
      })
      return response.body
    } catch (error) {
      console.error('Error deleting index:', error)
      throw error
    }
  }

  public async openIndex(name: string) {
    try {
      const response = await this.client.indices.open({
        index: name,
      })
      return response.body
    } catch (error) {
      console.error('Error opening index:', error)
      throw error
    }
  }

  public async closeIndex(name: string) {
    try {
      const response = await this.client.indices.close({
        index: name,
      })
      return response.body
    } catch (error) {
      console.error('Error closing index:', error)
      throw error
    }
  }

  public async getIndexSettings(name: string) {
    try {
      const response = await this.client.indices.getSettings({
        index: name,
        include_defaults: true,
      })
      return response.body
    } catch (error) {
      console.error('Error getting index settings:', error)
      throw error
    }
  }

  public async getIndexMappings(name: string) {
    try {
      const response = await this.client.indices.getMapping({
        index: name,
      })
      return response.body
    } catch (error) {
      console.error('Error getting index mappings:', error)
      throw error
    }
  }

  public async getIndexStats(name: string) {
    try {
      const response = await this.client.indices.stats({
        index: name,
      })
      return response.body
    } catch (error) {
      console.error('Error getting index stats:', error)
      throw error
    }
  }

  public async updateIndexSettings(name: string, settings: any) {
    try {
      const response = await this.client.indices.putSettings({
        index: name,
        body: settings,
      })
      return response.body
    } catch (error) {
      console.error('Error updating index settings:', error)
      throw error
    }
  }

  public async search(params: { index: string, body?: any, method?: string, path?: string }) {
    try {
      if (params.method === 'GET') {
        switch (params.path) {
          case '_mapping':
            return await this.client.indices.getMapping({ index: params.index })
          case '_settings':
            return await this.client.indices.getSettings({ index: params.index, include_defaults: true })
          case '_stats':
            return await this.client.indices.stats({ index: params.index })
          case '_segments':
            return await this.client.indices.segments({ index: params.index })
          default:
            return await this.client.search({ index: params.index })
        }
      }

      return await this.client.search({
        index: params.index,
        body: params.body,
      })
    } catch (error) {
      console.error('Error searching:', error)
      throw error
    }
  }
}

export { OpenSearchClient } 