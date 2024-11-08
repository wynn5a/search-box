import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { OpenSearchClient } from "@/lib/opensearch"

export async function GET() {
  try {
    // 获取所有集群
    const clusters = await prisma.cluster.findMany()
    
    let totalIndices = 0
    let totalStorage = 0
    let healthyClusters = 0
    let unhealthyClusters = 0

    // 获取每个集群的状态和统计信息
    for (const cluster of clusters) {
      try {
        const client = OpenSearchClient.getInstance(cluster)
        const [health, stats] = await Promise.all([
          client.getClusterHealth(),
          client.getClusterStats(),
        ])

        if (health.status === 'green') {
          healthyClusters++
        } else {
          unhealthyClusters++
        }

        totalIndices += stats.indices.count
        totalStorage += stats.indices.store.size_in_bytes
      } catch (error) {
        console.error(`Error fetching cluster ${cluster.name} stats:`, error)
        unhealthyClusters++
      }
    }

    return NextResponse.json({
      totalClusters: clusters.length,
      healthyClusters,
      unhealthyClusters,
      totalIndices,
      totalStorage,
    })
  } catch (error) {
    console.error("Error fetching clusters summary:", error)
    return NextResponse.json(
      { error: "Failed to fetch clusters summary" },
      { status: 500 }
    )
  }
} 