import { NextResponse } from "next/server"
import { OpenSearchClient } from "@/lib/opensearch"
import prisma from "@/lib/prisma"
import { generateDocumentTemplate } from "@/lib/template-generator"

export async function GET(
  request: Request,
  context: { params: Promise<{ clusterId: string; index: string }> }
) {
  try {
    const { clusterId, index } = await context.params

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
    const template = await generateDocumentTemplate(client, index)

    return NextResponse.json({
      success: true,
      data: template
    })
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