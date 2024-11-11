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
    const clusters = await clusterService.getAllClusters()
    
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

    // 打印调试信息
    console.log('Summary calculation:', {
      clusters: clusters.map(c => ({
        name: c.name,
        indices: c.stats?.indices?.count,
        storage: c.stats?.indices?.store?.size_in_bytes,
        health: c.health?.status
      })),
      totalIndices,
      totalStorage,
      healthyClusters,
      unhealthyClusters
    })

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