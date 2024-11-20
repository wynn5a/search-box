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

export async function PUT(request: NextRequest, props: { params: Promise<{ clusterId: string }> }) {
  const params = await props.params;
  try {
    const cluster = await getClusterConfig(params.clusterId)
    if (!cluster) {
      return Response.json(
        { success: false, error: "Cluster not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { type, path, value } = body

    if (!type || !path || value === undefined) {
      return Response.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (type !== 'persistent' && type !== 'transient') {
      return Response.json(
        { success: false, error: "Invalid setting type" },
        { status: 400 }
      )
    }

    const client = await OpenSearchClient.getInstance(cluster)
    
    // 构建设置对象
    const settings: any = {
      [type]: {
        [path]: value
      }
    }

    // 更新设置
    const response = await client.executeQuery({
      method: 'PUT',
      path: '_cluster/settings',
      body: settings
    })

    return Response.json({
      success: true,
      data: response
    })
  } catch (error) {
    console.error("Failed to update cluster settings:", error)
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to update cluster settings" 
      },
      { status: 500 }
    )
  }
}