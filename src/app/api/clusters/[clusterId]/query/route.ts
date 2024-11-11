import { handleApiRoute } from '@/lib/utils/api-utils'
import { indexService } from '@/lib/services/index-service'
import { ApiError } from '@/lib/errors/api-error'

export async function POST(
  request: Request,
  context: { params: Promise<{ clusterId: string }> }
) {
  return handleApiRoute(async () => {
    const body = await request.json()
    
    let queryBody = body.query
    if (typeof queryBody === 'string' && body.method !== 'GET') {
      try {
        queryBody = JSON.parse(queryBody)
      } catch (e) {
        throw ApiError.badRequest('Invalid JSON query')
      }
    }

    return indexService.executeQuery(
      (await context.params).clusterId,
      {
        index: body.index,
        method: body.method,
        path: body.path,
        body: queryBody,
      }
    )
  })
} 