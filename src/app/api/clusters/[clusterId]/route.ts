import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function DELETE(request: Request, props: { params: Promise<{ clusterId: string }> }) {
    const params = await props.params;
    try {
        const cluster = await prisma.cluster.delete({
            where: {
                id: params.clusterId,
            },
        })

        return NextResponse.json(cluster)
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
        console.log("clusterId type:", typeof clusterId, "value:", clusterId);
        
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