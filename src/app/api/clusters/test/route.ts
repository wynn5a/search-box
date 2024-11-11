import { NextResponse } from 'next/server'
import { OpenSearchClient } from '@/lib/opensearch'
import { handleApiRoute } from '@/lib/utils/api-utils'
import { ClusterConfig } from '@/types/cluster'

export async function POST(request: Request) {
  return handleApiRoute(async () => {
    const body = await request.json()
    const client = await OpenSearchClient.getInstance({
      id: 'test',
      name: 'test',
      url: body.url,
      username: body.username,
      password: body.password,
      isDefault: false,
      sshEnabled: false,
    })
    const isConnected = await client.testConnection()
    return { success: isConnected }
  })
} 