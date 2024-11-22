import { NextRequest } from "next/server"
import { getClusterConfig } from "@/lib/clusters"
import { OpenSearchClient } from "@/lib/opensearch"
import { handleApiRoute } from "@/lib/utils/api-utils"

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ clusterId: string }> }
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
    const stats = await client.getClusterStats()
    
    return {
      success: true,
      data: [{
        count: stats.indices.docs.count,
        epoch: Date.now(),
        timestamp: new Date().toISOString()
      }]
    }
  })
}
