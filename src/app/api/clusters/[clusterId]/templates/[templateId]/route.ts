import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function DELETE(
  request: Request,
  props: { params: Promise<{ clusterId: string; templateId: string }> }
) {
  const params = await props.params;
  try {
    await prisma.queryTemplate.delete({
      where: {
        id: params.templateId,
        clusterId: params.clusterId,
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
