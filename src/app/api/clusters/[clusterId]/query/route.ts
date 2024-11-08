import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { OpenSearchClient } from "@/lib/opensearch"

export async function POST(
  request: Request,
  context: { params: Promise<{ clusterId: string }> }
) {
  try {
    const cluster = await prisma.cluster.findUnique({
      where: {
        id: (await context.params).clusterId,
      },
    })

    if (!cluster) {
      return NextResponse.json(
        { error: "Cluster not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const client = OpenSearchClient.getInstance(cluster)
    
    // 检查是否是 GET 请求模板
    if (typeof body.query === 'string' && body.query.trim().toUpperCase().startsWith('GET')) {
      const firstLine = body.query.split('\n')[0]
      const path = firstLine.replace(/^GET\s+/, '').trim()
      const response = await client.search({
        index: body.index,
        method: 'GET',
        path: path.replace(/^\//, ''), // 移除开头的 /
      })
      return NextResponse.json(response.body)
    }

    // 处理普通的 JSON 查询
    try {
      const queryBody = typeof body.query === 'string' 
        ? JSON.parse(body.query) 
        : body.query

      const response = await client.search({
        index: body.index,
        body: queryBody,
      })
      return NextResponse.json(response.body)
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON query" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error executing query:", error)
    return NextResponse.json(
      { error: "Failed to execute query" },
      { status: 500 }
    )
  }
} 