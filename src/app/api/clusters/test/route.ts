import { OpenSearchClient } from '@/lib/opensearch'
import prisma from '@/lib/prisma'
import { handleApiRoute } from '@/lib/utils/api-utils'

export async function POST(request: Request) {
  return handleApiRoute(async () => {
    const body = await request.json()
    const {id} = body
    const cluster = await prisma.cluster.findUnique({
      where: {
        id: id
      }
    });

    if (!cluster) {
      throw new Error('Cluster not found')
    }

    // 解密密码
    const config = {
      ...cluster,
      password: cluster.password,
      sshPassword: cluster.sshPassword
    }

    const client = await OpenSearchClient.getInstance(config)
    const isConnected = await client.testConnection()
    return { success: isConnected }
  })
}