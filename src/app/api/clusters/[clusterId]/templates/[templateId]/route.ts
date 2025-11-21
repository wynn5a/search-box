import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getUserId } from "@/lib/utils/auth-utils"

export async function DELETE(
  request: Request,
  props: { params: Promise<{ clusterId: string; templateId: string }> }
) {
  const params = await props.params;
  try {
    const userId = await getUserId()

    // Verify template ownership by checking if user owns the cluster
    const template = await prisma.queryTemplate.findFirst({
      where: {
        id: params.templateId,
        clusterId: params.clusterId,
        userId
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    await prisma.queryTemplate.delete({
      where: {
        id: params.templateId,
      },
    })

    revalidatePath(`/clusters/${params.clusterId}/query`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete template:", error)
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    )
  }
}
