import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { OpenSearchClient } from "@/lib/opensearch"

interface RouteParams {
  clusterId: string
  indexName: string
}

async function getClient(clusterId: string) {
  const cluster = await prisma.cluster.findUnique({
    where: { id: clusterId },
  })

  if (!cluster) {
    throw new Error("Cluster not found")
  }

  return OpenSearchClient.getInstance(cluster)
}

// 删除索引
export async function DELETE(
  request: Request,
  context: { params: Promise<RouteParams> }
) {
  try {
    const { clusterId, indexName } = await context.params
    const client = await getClient(clusterId)
    await client.deleteIndex(indexName)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting index:", error)
    return NextResponse.json(
      { error: "Failed to delete index" },
      { status: 500 }
    )
  }
}

// 获取索引详情
export async function GET(
  request: Request,
  context: { params: Promise<RouteParams> }
) {
  try {
    const { clusterId, indexName } = await context.params
    const client = await getClient(clusterId)
    const settings = await client.getIndexSettings(indexName)
    const mappings = await client.getIndexMappings(indexName)
    const stats = await client.getIndexStats(indexName)

    return NextResponse.json({
      settings,
      mappings,
      stats,
    })
  } catch (error) {
    console.error("Error fetching index details:", error)
    return NextResponse.json(
      { error: "Failed to fetch index details" },
      { status: 500 }
    )
  }
} 