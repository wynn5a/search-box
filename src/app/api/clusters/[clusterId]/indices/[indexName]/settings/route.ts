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

export async function PUT(
  request: Request,
  context: { params: Promise<RouteParams> }
) {
  try {
    const { clusterId, indexName } = await context.params
    const body = await request.json()
    const client = await getClient(clusterId)
    
    await client.updateIndexSettings(indexName, body)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating index settings:", error)
    return NextResponse.json(
      { error: "Failed to update index settings" },
      { status: 500 }
    )
  }
} 