import prisma from "@/lib/prisma"
import { OpenSearchClient } from "@/lib/opensearch"
import { handleApiRoute } from "@/lib/utils/api-utils"

export async function GET(
  request: Request,
  context: { params: Promise<{ clusterId: string }> }
) {
  return handleApiRoute(async () => {
    const cluster = await prisma.cluster.findUnique({
      where: {
        id: (await context.params).clusterId,
      },
    })

    if (!cluster) {
      throw new Error("Cluster not found")
    }

    const client = await OpenSearchClient.getInstance(cluster)
    const [health, stats] = await Promise.all([
      client.getClusterHealth(),
      client.getClusterStats(),
    ])

    return { health, stats }
  })
} 