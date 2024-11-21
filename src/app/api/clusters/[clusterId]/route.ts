import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { tunnelManager } from "@/lib/tunnel-manager"

export async function DELETE(
    request: Request,
    context: { params: Promise<{ clusterId: string }> }
) {
    const { clusterId } = await context.params
    try {
        // Use transaction to ensure atomicity
        return await prisma.$transaction(async (tx) => {
            const cluster = await tx.cluster.findUnique({
                where: {
                    id: clusterId,
                },
            })

            if (!cluster) {
                return NextResponse.json(
                    { error: "Cluster not found" },
                    { status: 404 }
                )
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
    context: { params: Promise<{ clusterId: string }> }
) {
    try {
        const clusterId = (await context.params).clusterId;

        if (!clusterId) {
            return NextResponse.json({ error: "Invalid cluster ID" }, { status: 400 });
        }

        // 更新集群的最后连接时间并获取集群信息
        const cluster = await prisma.cluster.update({
            where: {
                id: String(clusterId),
            },
            data: {
                lastConnected: new Date()
            }
        })

        if (!cluster) {
            return NextResponse.json(
                { error: "Cluster not found" },
                { status: 404 }
            )
        }

        return NextResponse.json(cluster)
    } catch (error) {
        console.error("Error fetching cluster:", error)
        return NextResponse.json(
            { error: "Failed to fetch cluster" },
            { status: 500 }
        )
    }
} 