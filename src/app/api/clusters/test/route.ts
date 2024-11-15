import { OpenSearchClient } from '@/lib/opensearch'
import { handleApiRoute } from '@/lib/utils/api-utils'

export async function POST(request: Request) {
  return handleApiRoute(async () => {
    const body = await request.json()
    const client = await OpenSearchClient.getInstance(body)
    const isConnected = await client.testConnection()
    return { success: isConnected }
  })
} 