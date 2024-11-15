import { NextRequest } from "next/server"
import { getClusterConfig } from "@/lib/clusters"
import { OpenSearchClient } from "@/lib/opensearch"
import { handleApiRoute } from "@/lib/utils/api-utils"

export async function POST(request: NextRequest, props: { params: Promise<{ clusterId: string }> }) {
  const params = await props.params;
  return handleApiRoute(async () => {
    const cluster = await getClusterConfig(params.clusterId)
    if (!cluster) {
      return {
        success: false,
        error: "Cluster not found"
      }
    }

    const { method, path, body } = await request.json()
    const client = await OpenSearchClient.getInstance(cluster)
    const result = await client.executeQuery({ method, path, body })

    return {
      success: true,
      data: result
    }
  })
} 