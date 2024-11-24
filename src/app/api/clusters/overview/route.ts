import { NextResponse } from "next/server"
import { clusterService } from "@/lib/services/cluster-service"

export async function GET() {
  try {
    const clusters = await clusterService.getAllClusters()
    return NextResponse.json({
      success: true,
      data: clusters,
    })
  } catch (error) {
    console.error("Failed to get clusters overview:", error)
    return NextResponse.json({
      success: false,
      error: "获取集群概览失败",
    }, { status: 500 })
  }
}