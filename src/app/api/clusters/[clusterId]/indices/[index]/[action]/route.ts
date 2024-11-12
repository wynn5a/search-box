import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { OpenSearchClient } from "@/lib/opensearch"

interface RouteParams {
    clusterId: string
    index: string
    action: string
}

async function getClient(clusterId: string) {
    const cluster = await prisma.cluster.findUnique({
        where: { id: clusterId },
    })

    if (!cluster) {
        throw new Error("Cluster not found")
    }

    return OpenSearchClient.getInstance(cluster)
}

export async function POST(
    request: Request,
    context: { params: Promise<RouteParams> }
) {
    const { clusterId, index, action } = await context.params
    try {
        const client = await getClient(clusterId)

        switch (action) {
            case "open":
                await client.openIndex(index)
                break
            case "close":
                await client.closeIndex(index)
                break
            default:
                return NextResponse.json(
                    { error: "Invalid action" },
                    { status: 400 }
                )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(`Error ${action} index:`, error)
        return NextResponse.json(
            { error: `Failed to ${action} index` },
            { status: 500 }
        )
    }
} 