import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { OpenSearchClient } from "@/lib/opensearch"

export async function GET(
  request: Request,
  context: { params: Promise<{ clusterId: string }> }
) {
  try {
    const cluster = await prisma.cluster.findUnique({
      where: {
        id: (await context.params).clusterId,
      },
    })

    if (!cluster) {
      return NextResponse.json(
        { error: "Cluster not found" },
        { status: 404 }
      )
    }
    const client = OpenSearchClient.getInstance(cluster)
    const indices = await client.listIndices()

    return NextResponse.json(indices || [])
  } catch (error) {
    console.error("Error fetching indices:", error)
    return NextResponse.json([])
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ clusterId: string }> }
) {
  try {
    const cluster = await prisma.cluster.findUnique({
      where: {
        id: (await context.params).clusterId,
      },
    })

    if (!cluster) {
      return NextResponse.json(
        { error: "Cluster not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const client = OpenSearchClient.getInstance(cluster)
    
    const response = await client.createIndex(body.name, body.settings)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error creating index:", error)
    return NextResponse.json(
      { error: "Failed to create index" },
      { status: 500 }
    )
  }
} 