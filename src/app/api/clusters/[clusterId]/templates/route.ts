import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function GET(request: Request, props: { params: Promise<{ clusterId: string }> }) {
  const params = await props.params;
  try {
    const templates = await prisma.queryTemplate.findMany({
      where: {
        clusterId: params.clusterId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error("Failed to fetch templates:", error)
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request, props: { params: Promise<{ clusterId: string }> }) {
  const params = await props.params;
  try {
    const body = await request.json()
    const { name, description, method, path, body: queryBody, tags, category } = body

    const template = await prisma.queryTemplate.create({
      data: {
        name,
        description,
        method,
        path,
        body: queryBody || "",
        tags,
        category,
        clusterId: params.clusterId,
      },
    })

    revalidatePath(`/clusters/${params.clusterId}/query`)
    return NextResponse.json(template)
  } catch (error) {
    console.error("Failed to create template:", error)
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    )
  }
}
