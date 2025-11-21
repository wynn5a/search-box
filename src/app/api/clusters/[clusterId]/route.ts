import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserId } from "@/lib/utils/auth-utils"
import { tunnelManager } from "@/lib/tunnel-manager"

type RouteParams = {
    params: Promise<{ clusterId: string }>
}

export async function DELETE(
    request: Request,
    { params }: RouteParams
) {
    const { clusterId } = await params
    try {
        const userId = await getUserId()
        // Use transaction to ensure atomicity
        return await prisma.$transaction(async (tx) => {
            const cluster = await tx.cluster.findFirst({
                where: {
                    id: clusterId,
                    userId,
                },
            })

            if (!cluster) {
                return NextResponse.json({
                    success: false,
                    error: "集群不存在",
                }, { status: 404 })
            }

            if (cluster.sshEnabled) {
                await tunnelManager.closeTunnel(cluster.id)
            }

            // First delete all associated query templates
            await tx.queryTemplate.deleteMany({
                where: {
                    clusterId: clusterId,
                },
            })

            // Then delete the cluster
            await tx.cluster.delete({
                where: {
                    id: clusterId,
                },
            })

            return NextResponse.json({ success: true })
        })
    } catch (error) {
        console.error("Error deleting cluster:", error)
        return NextResponse.json(
            { error: "Failed to delete cluster" },
            { status: 500 }
        )
    }
}

export async function GET(
    request: Request,
    { params }: RouteParams
) {
    try {
        const userId = await getUserId()
        const { clusterId } = await params

        if (!clusterId) {
            return NextResponse.json({ error: "Invalid cluster ID" }, { status: 400 });
        }

        // 更新集群的最后连接时间并获取集群信息
        const cluster = await prisma.cluster.findFirst({
            where: {
                id: clusterId,
                userId
            }
        })

        if (!cluster) {
            return NextResponse.json(
                { error: "Cluster not found" },
                { status: 404 }
            )
        }

        // Update last connected time
        await prisma.cluster.update({
            where: {
                id: clusterId
            },
            data: {
                lastConnected: new Date()
            }
        })

        return NextResponse.json(cluster)
    } catch (error) {
        console.error("Error fetching cluster:", error)
        return NextResponse.json(
            { error: "Failed to fetch cluster" },
            { status: 500 }
        )
    }
} 