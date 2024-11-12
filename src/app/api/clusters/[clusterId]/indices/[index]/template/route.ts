import { NextResponse } from "next/server"
import { OpenSearchClient } from "@/lib/opensearch"
import prisma from "@/lib/prisma"

export async function GET(
  request: Request,
  context: { params: { clusterId: string; index: string } }
) {
  try {
    const { clusterId, index } = context.params

    const cluster = await prisma.cluster.findUnique({
      where: { id: clusterId }
    })

    if (!cluster) {
      return NextResponse.json(
        { success: false, error: "Cluster not found" },
        { status: 404 }
      )
    }

    const client = await OpenSearchClient.getInstance(cluster)
    const template = await client.generateIndexTemplate(index)

    return NextResponse.json(template)
  } catch (error) {
    console.error('Template generation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate template' 
      },
      { status: 500 }
    )
  }
} 