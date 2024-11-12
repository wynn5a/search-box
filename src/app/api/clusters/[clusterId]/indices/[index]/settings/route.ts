import { z } from "zod"
import { handleApiRoute, validateRequestBody, validateParams } from "@/lib/utils/api-utils"
import { clusterService } from "@/lib/services/cluster-service"
import { ApiError } from "@/lib/errors/api-error"

const paramsSchema = z.object({
  clusterId: z.string().min(1),
  index: z.string().min(1),
})

const settingsSchema = z.object({
  index: z.object({
    number_of_replicas: z.number().min(0).optional(),
    refresh_interval: z.string().optional(),
    blocks: z.object({
      read_only: z.boolean().optional(),
      read_only_allow_delete: z.boolean().optional(),
    }).optional(),
  }).strict(),
})

type IndexSettings = z.infer<typeof settingsSchema>

export async function PUT(
  request: Request,
  context: { params: Promise<{ clusterId: string; index: string }> }
) {
  return handleApiRoute(async () => {
    const params = validateParams(paramsSchema, (await context.params))
    const body = await request.json()
    const settings = validateRequestBody<IndexSettings>(
      settingsSchema,
      body,
      'Invalid index settings'
    )
    
    const client = await clusterService.getOpenSearchClient(params.clusterId)
    await client.updateIndexSettings(params.index, settings)
    
    return {
      message: `Successfully updated settings for index ${params.index}`,
      index: params.index,
    }
  }, {
    successMessage: 'Index settings updated successfully',
    errorMessage: 'Failed to update index settings'
  });
} 