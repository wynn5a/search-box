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
    const [health, stats] = await Promise.all([
      client.getClusterHealth(),
      client.getClusterStats(),
    ])

    return NextResponse.json({ health, stats })
  } catch (error) {
    console.error("Error fetching cluster stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch cluster stats" },
      { status: 500 }
    )
  }
} 