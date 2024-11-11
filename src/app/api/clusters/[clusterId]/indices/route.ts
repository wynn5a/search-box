import { z } from "zod"
import { handleApiRoute, validateRequestBody } from "@/lib/utils/api-utils"
import { clusterService } from "@/lib/services/cluster-service"
import { ApiError } from "@/lib/errors/api-error"

// 定义基础的设置类型
const indexSettingsSchema = z.object({
  number_of_shards: z.number().min(1),
  number_of_replicas: z.number().min(0),
  refresh_interval: z.string().optional(),
}).required()

// 定义创建索引的请求体类型
const createIndexSchema = z.object({
  name: z.string().min(1).regex(/^[a-z0-9-_]+$/, {
    message: "索引名称只能包含小写字母、数字、横线和下划线",
  }),
  settings: indexSettingsSchema,
  mappings: z.record(z.any()).optional(),
})

// 导出类型以供其他地方使用
export type CreateIndexRequest = z.infer<typeof createIndexSchema>
export type IndexSettings = z.infer<typeof indexSettingsSchema>

export async function GET(
  request: Request,
  context: { params: Promise<{ clusterId: string }> }
) {
  return handleApiRoute(async () => {
    const client = await clusterService.getOpenSearchClient((await context.params).clusterId)
    const indices = await client.listIndices()
    return Array.isArray(indices) ? indices : []
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ clusterId: string }> }
) {
  return handleApiRoute(async () => {
    const body = await request.json()
    const data = validateRequestBody<CreateIndexRequest>(createIndexSchema, body)
    
    const client = await clusterService.getOpenSearchClient((await context.params).clusterId)
    
    try {
      await client.createIndex(data.name, {
        settings: {
          number_of_shards: data.settings.number_of_shards,
          number_of_replicas: data.settings.number_of_replicas,
          refresh_interval: data.settings.refresh_interval,
        },
        mappings: data.mappings,
      })
      
      return {
        message: `Successfully created index ${data.name}`,
        index: data.name,
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        throw new ApiError(`Index ${data.name} already exists`, 409)
      }
      throw error
    }
  });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ clusterId: string; indexName: string }> }
) {
  return handleApiRoute(async () => {
    const { clusterId, indexName } = (await context.params)
    
    if (indexName.startsWith('.')) {
      throw new ApiError('Cannot delete system indices', 403)
    }
    
    const client = await clusterService.getOpenSearchClient(clusterId)
    await client.executeQuery({
      index: indexName,
      method: 'DELETE',
      path: '/',
    })
    
    return {
      message: `Successfully deleted index ${indexName}`,
    }
  });
} 