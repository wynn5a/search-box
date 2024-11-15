import { NextRequest } from "next/server"
import { getClusterConfig } from "@/lib/clusters"
import { OpenSearchClient } from "@/lib/opensearch"
import { handleApiRoute } from "@/lib/utils/api-utils"

export async function GET(request: NextRequest, props: { params: Promise<{ clusterId: string }> }) {
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
    const indices = await client.listIndices()

    return {
      success: true,
      data: indices
    }
  })
}

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

    const { name, settings, mappings } = await request.json()
    const client = await OpenSearchClient.getInstance(cluster)
    await client.createIndex(name, { settings, mappings })

    return {
      success: true,
      data: {
        message: "Index created successfully",
        index: name
      }
    }
  })
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ clusterId: string }> }) {
  const params = await props.params;
  return handleApiRoute(async () => {
    const cluster = await getClusterConfig(params.clusterId)
    if (!cluster) {
      return {
        success: false,
        error: "Cluster not found"
      }
    }

    const { name } = await request.json()
    const client = await OpenSearchClient.getInstance(cluster)
    await client.deleteIndex(name)

    return {
      success: true,
      data: {
        message: "Index deleted successfully"
      }
    }
  })
} 