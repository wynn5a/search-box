import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const cluster = await prisma.cluster.create({
      data: {
        name: body.name,
        url: body.url,
        username: body.username,
        password: body.password,
        isDefault: false,
      },
    })
    return NextResponse.json(cluster)
  } catch (error) {
    console.error("Error creating cluster:", error)
    return NextResponse.json(
      { error: "Failed to create cluster" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const clusters = await prisma.cluster.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })
    return NextResponse.json(clusters)
  } catch (error) {
    console.error("Error fetching clusters:", error)
    return NextResponse.json(
      { error: "Failed to fetch clusters" },
      { status: 500 }
    )
  }
} 