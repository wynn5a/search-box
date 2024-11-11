import { NextResponse } from 'next/server'
import { OpenSearchClient } from '@/lib/opensearch'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // 获取默认集群或第一个可用集群
    const cluster = await prisma.cluster.findFirst({
      where: {
        OR: [
          { isDefault: true },
          { id: { not: '' } } // 任意集群
        ]
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    if (!cluster) {
      return NextResponse.json(
        { error: 'No cluster configured' },
        { status: 404 }
      )
    }

    const client = await OpenSearchClient.getInstance(cluster)
    const [health, stats, nodes] = await Promise.all([
      client.getClusterHealth(),
      client.getClusterStats(),
      client.getNodes(),
    ])

    return NextResponse.json({
      health,
      stats,
      nodes,
      currentCluster: {
        id: cluster.id,
        name: cluster.name,
        url: cluster.url,
      }
    })
  } catch (error) {
    console.error('Error fetching cluster info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cluster information' },
      { status: 500 }
    )
  }
} 