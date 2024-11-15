import { NextRequest } from "next/server"
import { getClusterConfig } from "@/lib/clusters"
import { OpenSearchClient } from "@/lib/opensearch"
import { handleApiRoute } from "@/lib/utils/api-utils"

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export async function GET(request: NextRequest, props: { params: Promise<{ clusterId: string }> }): Promise<Response> {
  const params = await props.params;
  return handleApiRoute<{ health: any; stats: any }>(async () => {
    const cluster = await getClusterConfig(params.clusterId)
    if (!cluster) {
      return {
        success: false,
        error: "Cluster not found"
      }
    }

    const client = await OpenSearchClient.getInstance(cluster)
    const [health, stats] = await Promise.all([
      client.getClusterHealth(),
      client.getClusterStats()
    ])

    return {
      success: true,
      data: {
        health,
        stats
      }
    }
  })
} 