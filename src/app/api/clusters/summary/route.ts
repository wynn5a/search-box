import { handleApiRoute } from "@/lib/utils/api-utils"
import { clusterService } from "@/lib/services/cluster-service"
import { ApiError } from "@/lib/errors/api-error"
import { NextResponse } from 'next/server'

interface ClusterSummary {
  totalClusters: number;
  healthyClusters: number;
  unhealthyClusters: number;
  totalIndices: number;
  totalStorage: number;
}

export async function GET(): Promise<NextResponse> {
  return handleApiRoute<ClusterSummary>(async () => {
    const clusters = await clusterService.getAllClusters()
    
    let totalIndices = 0
    let healthyClusters = 0
    let unhealthyClusters = 0
    let totalStorage = 0

    await Promise.all(clusters.map(async (cluster) => {
      try {
        const client = await clusterService.getOpenSearchClient(cluster.id)
        const [health, stats] = await Promise.all([
          client.getClusterHealth(),
          client.getClusterStats(),
        ])

        if (health.status === 'green' || health.status === 'yellow') {
          healthyClusters++
        } else {
          unhealthyClusters++
        }

        totalIndices += stats.indices.count || 0
        totalStorage += stats.indices.store?.size_in_bytes || 0
      } catch (error) {
        console.error(`Error fetching cluster ${cluster.name} stats:`, error)
        unhealthyClusters++
      }
    }))

    return {
      totalClusters: clusters.length,
      healthyClusters,
      unhealthyClusters,
      totalIndices,
      totalStorage,
    }
  }, {
    errorMessage: 'Failed to fetch clusters summary'
  })
} 