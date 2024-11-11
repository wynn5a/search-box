import prisma from "@/lib/prisma"
import { ClusterConfig } from "@/types/cluster"
import { tunnelManager } from "@/lib/tunnel-manager"
import { OpenSearchClient } from "@/lib/opensearch"
import { ApiError } from "@/lib/errors/api-error"

export class ClusterService {
  private static instance: ClusterService

  private constructor() {}

  public static getInstance(): ClusterService {
    if (!ClusterService.instance) {
      ClusterService.instance = new ClusterService()
    }
    return ClusterService.instance
  }

  public async getCluster(id: string): Promise<ClusterConfig> {
    const cluster = await prisma.cluster.findUnique({
      where: { id }
    })

    if (!cluster) {
      throw new ApiError('Cluster not found', 404)
    }

    return this.transformClusterData(cluster)
  }

  public async getOpenSearchClient(clusterId: string): Promise<OpenSearchClient> {
    const config = await this.getCluster(clusterId)
    return OpenSearchClient.getInstance(config)
  }

  public async getClusterHealth(clusterId: string) {
    try {
      const client = await this.getOpenSearchClient(clusterId)
      const [health, stats] = await Promise.all([
        client.getClusterHealth(),
        client.getClusterStats(),
      ])
      
      return {
        health,
        stats,
        currentCluster: {
          id: clusterId,
        }
      }
    } catch (error) {
      console.error(`Error getting cluster health for ${clusterId}:`, error)
      return {
        health: {
          status: 'red',
          number_of_nodes: 0,
          active_shards: 0,
          relocating_shards: 0,
          initializing_shards: 0,
          unassigned_shards: 0,
        },
        stats: {
          indices: {
            count: 0,
            docs: { count: 0 },
            store: { size_in_bytes: 0 },
          }
        },
        currentCluster: {
          id: clusterId,
        }
      }
    }
  }

  public async getAllClustersHealth() {
    const clusters = await prisma.cluster.findMany()
    const results = await Promise.allSettled(
      clusters.map(async (cluster) => {
        try {
          const client = await OpenSearchClient.getInstance(this.transformClusterData(cluster))
          const health = await client.getClusterHealth()
          return {
            clusterId: cluster.id,
            health: health.status
          }
        } catch (error) {
          console.error(`Error getting health for cluster ${cluster.id}:`, error)
          return {
            clusterId: cluster.id,
            health: 'red'
          }
        }
      })
    )

    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value
      }
      return {
        clusterId: 'unknown',
        health: 'red'
      }
    })
  }

  public async getAllClusters() {
    const clusters = await prisma.cluster.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return Promise.all(clusters.map(async (cluster) => {
      const transformed = this.transformClusterData(cluster)
      try {
        const client = await OpenSearchClient.getInstance(transformed)
        const [health, stats] = await Promise.all([
          client.getClusterHealth(),
          client.getClusterStats()
        ])

        console.log(`Stats for cluster ${cluster.name}:`, {
          health: health,
          stats: stats
        })

        return {
          ...transformed,
          health: {
            status: health.status,
            number_of_nodes: health.number_of_nodes,
            active_shards: health.active_shards,
            relocating_shards: health.relocating_shards,
            initializing_shards: health.initializing_shards,
            unassigned_shards: health.unassigned_shards,
          },
          stats: {
            indices: {
              count: stats.indices.count,
              docs: {
                count: stats.indices.docs.count,
              },
              store: {
                size_in_bytes: stats.indices.store.size_in_bytes,
                total_data_set_size_in_bytes: stats.indices.store.total_data_set_size_in_bytes,
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error getting stats for cluster ${cluster.id}:`, error)
        return {
          ...transformed,
          health: {
            status: 'red',
            number_of_nodes: 0,
            active_shards: 0,
            relocating_shards: 0,
            initializing_shards: 0,
            unassigned_shards: 0,
          },
          stats: {
            indices: {
              count: 0,
              docs: { count: 0 },
              store: {
                size_in_bytes: 0,
                total_data_set_size_in_bytes: 0,
              }
            }
          }
        }
      }
    }))
  }

  public async getDefaultCluster() {
    const cluster = await prisma.cluster.findFirst({
      where: {
        isDefault: true,
      },
    })
    return cluster ? this.transformClusterData(cluster) : null
  }

  public async setDefaultCluster(clusterId: string) {
    await prisma.$transaction([
      prisma.cluster.updateMany({
        where: {
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      }),
      prisma.cluster.update({
        where: {
          id: clusterId,
        },
        data: {
          isDefault: true,
        },
      }),
    ])
  }

  public async deleteCluster(clusterId: string) {
    const cluster = await prisma.cluster.findUnique({
      where: { id: clusterId },
    })

    if (!cluster) {
      throw new ApiError('Cluster not found', 404)
    }

    if (cluster.sshEnabled) {
      await tunnelManager.closeTunnel(clusterId)
    }

    await prisma.cluster.delete({
      where: { id: clusterId },
    })
  }

  private transformClusterData(cluster: any): ClusterConfig {
    return {
      id: cluster.id,
      name: cluster.name,
      url: cluster.url,
      username: cluster.username,
      password: cluster.password,
      isDefault: cluster.isDefault,
      sshEnabled: cluster.sshEnabled || false,
      sshHost: cluster.sshHost,
      sshPort: cluster.sshPort,
      sshUser: cluster.sshUser,
      sshPassword: cluster.sshPassword,
      sshKeyFile: cluster.sshKeyFile,
      localPort: cluster.localPort,
      remoteHost: cluster.remoteHost,
      remotePort: cluster.remotePort,
      createdAt: cluster.createdAt,
      updatedAt: cluster.updatedAt,
    }
  }
}

export const clusterService = ClusterService.getInstance()