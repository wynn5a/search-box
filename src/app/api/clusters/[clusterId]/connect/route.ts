import { NextResponse } from "next/server"
import { clusterService } from "@/lib/services/cluster-service"
import { promises } from "dns"

export async function POST(
  request: Request,
  context: { params: Promise<{ clusterId: string }> }
) {
  try {
    const { clusterId } = await context.params
    await clusterService.updateLastConnected(clusterId)
    
    return NextResponse.json({
      success: true,
      message: "Last connected time updated"
    })
  } catch (error) {
    console.error('Failed to update last connected time:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update last connected time' 
      },
      { status: 500 }
    )
  }
} 