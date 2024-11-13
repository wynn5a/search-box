import { NextResponse } from "next/server"
import { clusterService } from "@/lib/services/cluster-service"

export async function POST(
  request: Request,
  context: { params: Promise<{ clusterId: string; index: string; action: string }> }
) {
  const { clusterId, index, action } = await context.params
  try {

    await clusterService.executeIndexOperation(clusterId, {
      method: 'POST',
      path: `/${index}/_${action}`,
    })

    return NextResponse.json({
      success: true,
      message: `Index ${action} successful`
    })
  } catch (error) {
    console.error(`Index ${action} error:`, error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : `Failed to ${action} index` 
      },
      { status: 500 }
    )
  }
} 