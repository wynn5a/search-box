import { handleApiRoute } from "@/lib/utils/api-utils"
import { clusterService } from "@/lib/services/cluster-service"
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
    const { getUserId } = await import("@/lib/utils/auth-utils")
    const userId = await getUserId()
    const clusters = await clusterService.getAllClusters(userId)

    let totalIndices = 0
    let totalStorage = 0
    let healthyClusters = 0
    let unhealthyClusters = 0

    clusters.forEach(cluster => {
      // 计算索引总数
      if (cluster.stats?.indices?.count) {
        totalIndices += cluster.stats.indices.count
      }

      // 计算存储空间
      if (cluster.stats?.indices?.store?.size_in_bytes) {
        totalStorage += cluster.stats.indices.store.size_in_bytes
      }

      // 计算健康状态
      if (cluster.health?.status === 'green' || cluster.health?.status === 'yellow') {
        healthyClusters++
      } else {
        unhealthyClusters++
      }
    })
    return {
      success: true,
      data: {
        totalClusters: clusters.length,
        healthyClusters,
        unhealthyClusters,
        totalIndices,
        totalStorage,
      }
    };
  }, {
    errorMessage: 'Failed to fetch clusters summary'
  })
} 