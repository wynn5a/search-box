import { NextRequest } from "next/server"
import { getClusterConfig } from "@/lib/clusters"
import { OpenSearchClient } from "@/lib/opensearch"
import { handleApiRoute } from "@/lib/utils/api-utils"

export async function GET(
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

    const client = await OpenSearchClient.getInstance(cluster)
    const mappings = await client.getIndexMappings(params.index)

    return {
      success: true,
      data: mappings[params.index]?.mappings || {}
    }
  })
}

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

    const mappings = await request.json()
    const client = await OpenSearchClient.getInstance(cluster)
    
    try {
      await client.putIndexMappings(params.index, mappings)

      return {
        success: true,
        data: {
          message: "Mappings updated successfully",
          index: params.index
        }
      }
    } catch (error: any) {
      // 处理 OpenSearch 的错误响应
      if (error.body?.error?.reason) {
        return {
          success: false,
          error: `Failed to update mappings: ${error.body.error.reason}`
        }
      }
      throw error
    }
  })
} 