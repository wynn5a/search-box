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
  name: z.string().min(2, "集群名称至少2个字符"),
  url: z.string().url("请输入有效的URL地址"),
  username: z.string().nullable().optional(),
  password: z.string().nullable().optional(),
  sshEnabled: z.boolean().default(false),
  sshHost: z.string().nullable().optional(),
  sshPort: z.coerce.number().nullable().optional(),
  sshUser: z.string().nullable().optional(),
  sshPassword: z.string().nullable().optional(),
  sshKeyFile: z.string().nullable().optional(),
  localPort: z.coerce.number().nullable().optional(),
  remoteHost: z.string().nullable().optional(),
  remotePort: z.coerce.number().nullable().optional(),
}).refine((data) => {
  if (data.sshEnabled) {
    return !!(data.sshHost && data.sshUser && (data.sshPassword || data.sshKeyFile))
  }
  return true
}, {
  message: "启用SSH隧道时，必须填写主机地址、用户名和认证信息",
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("Creating cluster", { ...body, password: '***', sshPassword: '***' })
    const data = validateRequestBody(createClusterSchema, body)

    // 使用随机端口进行测试
    const testPort = getRandomPort()
    
    // 处理 remoteHost，移除可能的协议前缀
    let remoteHost = data.remoteHost
    try {
      if (remoteHost?.startsWith('http')) {
        const url = new URL(remoteHost)
        remoteHost = url.hostname
      }
    } catch (e) {
      console.error('Error parsing remoteHost:', e)
    }
    
    // 测试连接
    const testClient = await OpenSearchClient.getInstance({
      id: 'test',
      name: 'test',
      url: data.url,
      username: data.username || undefined,
      password: data.password || undefined,
      sshEnabled: data.sshEnabled || false,
      sshHost: data.sshHost || undefined,
      sshPort: data.sshPort || undefined,
      sshUser: data.sshUser || undefined,
      sshPassword: data.sshPassword || undefined,
      sshKeyFile: data.sshKeyFile || undefined,
      localPort: data.sshEnabled ? testPort : undefined,
      remoteHost: remoteHost || undefined,  // 使用处理后的 remoteHost
      remotePort: data.remotePort || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const isConnected = await testClient.testConnection(10000)
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        error: "无法连接到集群",
        details: "连接超时或无法访问，请检查集群地址和认证信息是否正确",
      }, { status: 400 })
    }

    // 如果是第一个集群，设置为默认集群
    const existingClusters = await prisma.cluster.count()
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
        localPort: data.localPort || null,
        remoteHost: remoteHost || null,  // 使用处理后的 remoteHost
        remotePort: data.remotePort || null,
      },
    })

    return NextResponse.json({
      success: true,
      message: "集群添加成功",
      cluster: {
        id: cluster.id,
        name: cluster.name,
        url: cluster.url,
        isDefault: cluster.isDefault,
      },
    })
  } catch (error) {
    console.error("Error creating cluster:", error)
    
    // 处理验证错误
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "验证失败",
        details: error.errors.map(err => err.message).join(", "),
      }, { status: 400 })
    }

    // 处理其他错误
    return NextResponse.json({
      success: false,
      error: "添加集群失败",
      details: error instanceof Error ? error.message : "未知错误",
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log('Getting clusters from database...')
    const clusters = await prisma.cluster.findMany({
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
      error: "获取集群列表失败",
      details: error instanceof Error ? error.message : "未知错误",
    }, { status: 500 })
  }
}