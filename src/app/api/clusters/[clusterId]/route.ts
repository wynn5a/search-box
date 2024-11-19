import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { tunnelManager } from "@/lib/tunnel-manager"

export async function DELETE(
    request: Request,
    context: { params: Promise<{ clusterId: string }> }
) {
    try {
        const cluster = await prisma.cluster.findUnique({
            where: {
                id: (await context.params).clusterId,
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

        await prisma.cluster.delete({
            where: {
                id: (await context.params).clusterId,
            },
        })

        return NextResponse.json({ success: true })
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

        const cluster = await prisma.cluster.findUnique({
            where: {
                id: String(clusterId),
            },
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