import { NextRequest } from "next/server"
import { getClusterConfig } from "@/lib/clusters"
import { OpenSearchClient } from "@/lib/opensearch"

export async function GET(request: NextRequest, props: { params: Promise<{ clusterId: string }> }) {
  const params = await props.params;
  try {
    const cluster = await getClusterConfig(params.clusterId)
    if (!cluster) {
      return Response.json(
        { success: false, error: "Cluster not found" },
        { status: 404 }
      )
    }

    const client = await OpenSearchClient.getInstance(cluster)
    const settings = await client.getClusterSettings({
      include_defaults: true,
      flat_settings: false
    })

    return Response.json({
      success: true,
      data: settings
    })
  } catch (error) {
    console.error("Failed to get cluster settings:", error)
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to get cluster settings" 
      },
      { status: 500 }
    )
  }
} 