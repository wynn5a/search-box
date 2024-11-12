import { NextResponse } from "next/server"
import { clusterService } from "@/lib/services/cluster-service"
import { handleApiRoute } from "@/lib/utils/api-utils"
import { z } from "zod"

const querySchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "DELETE"]),
  path: z.string(),
  query: z.string().optional(),
})

export async function POST(
  request: Request,
  context: { params: { clusterId: string } }
) {
  return handleApiRoute(async () => {
    const body = await request.json()
    const { method, path, query } = querySchema.parse(body)

    const client = await clusterService.getOpenSearchClient(context.params.clusterId)

    let queryBody
    if (query && method !== 'GET') {
      try {
        queryBody = JSON.parse(query)
      } catch (e) {
        throw new Error("Invalid JSON in query body")
      }
    }

    const response = await client.executeQuery({
      method,
      path,
      body: queryBody,
    })

    return response
  })
} 