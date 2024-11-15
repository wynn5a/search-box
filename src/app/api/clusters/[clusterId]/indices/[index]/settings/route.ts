import { NextRequest } from "next/server"
import { getClusterConfig } from "@/lib/clusters"
import { OpenSearchClient } from "@/lib/opensearch"
import { handleApiRoute } from "@/lib/utils/api-utils"

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ clusterId: string; index: string }> }
) {
  const params = await props.params;
  return handleApiRoute(async () => {
    const cluster = await getClusterConfig(params.clusterId)
    if (!cluster) {
      return {
        success: false,
        error: "Cluster not found"
      }
    }

    const settings = await request.json()
    const client = await OpenSearchClient.getInstance(cluster)
    await client.updateIndexSettings(params.index, settings)

    return {
      success: true,
      data: {
        message: "Settings updated successfully",
        index: params.index
      }
    }
  })
} 