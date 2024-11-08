import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function PUT(
  request: Request,
  context: { params: Promise<{ clusterId: string }> }
) {
  const clusterId = (await context.params).clusterId

  try {
    // 获取当前集群
    const currentCluster = await prisma.cluster.findUnique({
      where: {
        id: clusterId,
      },
    })

    if (!currentCluster) {
      return NextResponse.json(
        { error: "Cluster not found" },
        { status: 404 }
      )
    }

    if (currentCluster.isDefault) {
      // 如果当前是默认集群，则取消设置
      const cluster = await prisma.cluster.update({
        where: {
          id: clusterId,
        },
        data: {
          isDefault: false,
        },
      })
      return NextResponse.json(cluster)
    } else {
      // 先将所有集群设置为非默认
      await prisma.cluster.updateMany({
        data: {
          isDefault: false,
        },
      })

      // 将指定集群设置为默认
      const cluster = await prisma.cluster.update({
        where: {
          id: clusterId,
        },
        data: {
          isDefault: true,
        },
      })
      return NextResponse.json(cluster)
    }
  } catch (error) {
    console.error("Error setting default cluster:", error)
    return NextResponse.json(
      { error: "Failed to set default cluster" },
      { status: 500 }
    )
  }
} 