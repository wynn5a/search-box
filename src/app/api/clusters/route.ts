import { NextResponse } from "next/server"
import { z } from "zod"
import { validateRequestBody } from "@/lib/utils/api-utils"
import prisma from "@/lib/prisma"
import { OpenSearchClient } from "@/lib/opensearch"
import { encrypt } from "@/lib/utils/crypto"

// 获取一个随机的可用端口
function getRandomPort(min: number = 10000, max: number = 65535): number {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

const createClusterSchema = z.object({
  name: z.string().min(2, "Cluster name must be at least 2 characters"),
  url: z.string().url("Please enter a valid URL"),
  username: z.string().nullable().optional(),
  password: z.string().nullable().optional(),
  sshEnabled: z.boolean().default(false),
  sshHost: z.string().nullable().optional(),
  sshPort: z.coerce.number().nullable().optional(),
  sshUser: z.string().nullable().optional(),
  sshPassword: z.string().nullable().optional(),
  sshKeyFile: z.string().nullable().optional(),
}).refine((data) => {
  if (data.sshEnabled) {
    return !!(data.sshHost && data.sshUser && (data.sshPassword || data.sshKeyFile))
  }
  return true
}, {
  message: "When SSH tunnel is enabled, host address, username, and authentication information are required",
})

export async function POST(request: Request) {
  try {
    // Authenticate user
    const { getUserId } = await import("@/lib/utils/auth-utils")
    const userId = await getUserId()

    const body = await request.json()
    console.log("Creating cluster", { ...body, password: '***', sshPassword: '***' })
    const data = validateRequestBody(createClusterSchema, body)

    // 使用随机端口进行测试
    const testPort = getRandomPort()

    // 处理 remoteHost，移除可能的协议前缀
    let remoteHost = 'localhost'
    try {
      if (data.url?.startsWith('http')) {
        const url = new URL(data.url)
        remoteHost = url.hostname
      }
    } catch (e) {
      console.error('Error parsing remoteHost:', e)
    }

    // 测试连接
    const testClient = await OpenSearchClient.getInstance({
      id: `testing-${data.name}`,
      name: data.name,
      url: data.url,
      username: data.username || undefined,
      password: data.password ? encrypt(data.password) : undefined,
      sshEnabled: data.sshEnabled || false,
      sshHost: data.sshHost || undefined,
      sshPort: data.sshPort || undefined,
      sshUser: data.sshUser || undefined,
      sshPassword: data.sshPassword ? encrypt(data.sshPassword) : undefined,
      sshKeyFile: data.sshKeyFile || undefined,
      localPort: data.sshEnabled ? testPort : undefined,
      remoteHost: remoteHost,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const isConnected = await testClient.testConnection(10000)
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        error: "Unable to connect to cluster",
        details: "Connection timeout or unable to access. Please check the cluster address and authentication information.",
      }, { status: 400 })
    }

    // 如果是用户的第一个集群，设置为默认集群
    const existingClusters = await prisma.cluster.count({
      where: { userId }
    })
    const isDefault = existingClusters === 0

    // 加密密码
    const encryptedPassword = data.password ? encrypt(data.password) : null
    const encryptedSshPassword = data.sshPassword ? encrypt(data.sshPassword) : null

    const cluster = await prisma.cluster.create({
      data: {
        name: data.name,
        url: data.url,
        username: data.username || null,
        password: encryptedPassword,
        isDefault,
        sshEnabled: data.sshEnabled,
        sshHost: data.sshHost || null,
        sshPort: data.sshPort || null,
        sshUser: data.sshUser || null,
        sshPassword: encryptedSshPassword,
        sshKeyFile: data.sshKeyFile || null,
        localPort: data.sshEnabled ? testPort : null,
        remoteHost: remoteHost,
        remotePort: 9200,
        userId,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Cluster added successfully",
      cluster: {
        id: cluster.id,
        name: cluster.name,
        url: cluster.url,
        isDefault: cluster.isDefault,
      },
    })
  } catch (error) {
    console.error("Error creating cluster:", error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Validation failed",
        details: error.errors.map(err => err.message).join(", "),
      }, { status: 400 })
    }

    // Handle other errors
    return NextResponse.json({
      success: false,
      error: "Failed to add cluster",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Authenticate user
    const { getUserId } = await import("@/lib/utils/auth-utils")
    const userId = await getUserId()

    console.log('Getting clusters from database...')
    const clusters = await prisma.cluster.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        url: true,
        username: true,
        isDefault: true,
        sshEnabled: true,
        sshHost: true,
        sshPort: true,
        sshUser: true,
        sshKeyFile: true,
        localPort: true,
        remoteHost: true,
        remotePort: true,
        createdAt: true,
        updatedAt: true,
        lastConnected: true
      }
    })

    console.log('Found clusters:', clusters.length)

    if (clusters.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    console.log('Getting health for each cluster...')
    const clustersWithHealth = await Promise.all(
      clusters.map(async (cluster) => {
        try {
          console.log(`Getting health for cluster ${cluster.id}...`)
          // 获取完整的集群信息（包含密码）用于连接测试
          const fullCluster = await prisma.cluster.findUnique({
            where: { id: cluster.id },
          })

          if (!fullCluster) {
            console.log(`Cluster ${cluster.id} not found in database`)
            throw new Error('Cluster not found')
          }

          console.log(`Creating OpenSearch client for cluster ${cluster.id}...`)
          const client = await OpenSearchClient.getInstance({
            id: cluster.id,
            name: cluster.name,
            url: cluster.url,
            username: cluster.username || undefined,
            password: fullCluster.password,
            sshEnabled: cluster.sshEnabled,
            sshHost: cluster.sshHost || undefined,
            sshPort: cluster.sshPort || undefined,
            sshUser: cluster.sshUser || undefined,
            sshPassword: fullCluster.sshPassword,
            sshKeyFile: cluster.sshKeyFile || undefined,
            localPort: cluster.localPort || undefined,
            remoteHost: cluster.remoteHost || undefined,
            remotePort: cluster.remotePort || undefined,
            createdAt: cluster.createdAt,
            updatedAt: cluster.updatedAt,
          })
          const health = await client.getClusterHealth()

          return {
            ...cluster,
            health: {
              status: health.status,
              error: null
            }
          }
        } catch (error) {
          console.error(`Error getting health for cluster ${cluster.id}:`, error)
          return {
            ...cluster,
            health: {
              status: 'unknown',
              error: error instanceof Error ? error.message : '未知错误'
            }
          }
        }
      })
    )

    console.log('Returning clusters with health...')
    return NextResponse.json({
      success: true,
      data: clustersWithHealth
    })
  } catch (error) {
    console.error("Error getting clusters:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to get cluster list",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
}