import prisma from "@/lib/prisma"
import type { ClusterConfig } from "@/types/cluster"

export async function getClusterConfig(clusterId: string): Promise<ClusterConfig | null> {
  try {
    const cluster = await prisma.cluster.findUnique({
      where: { id: clusterId }
    })
    
    if (!cluster) return null

    return {
      id: cluster.id,
      name: cluster.name,
      url: cluster.url,
      username: cluster.username || "",
      password: cluster.password || "",
      sshEnabled: cluster.sshEnabled,
      sshHost: cluster.sshHost || "",
      sshPort: cluster.sshPort || 22,
      sshUser: cluster.sshUser || "",
      sshPassword: cluster.sshPassword || "",
      sshKeyFile: cluster.sshKeyFile || "",
      localPort: cluster.localPort || 9200,
      remoteHost: cluster.remoteHost || "localhost",
      remotePort: cluster.remotePort || 9200,
      createdAt: cluster.createdAt,
      updatedAt: cluster.updatedAt
    }
  } catch (error) {
    console.error("Failed to get cluster config:", error)
    return null
  }
} 