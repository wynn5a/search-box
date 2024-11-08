"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { ClusterConfig } from "@/types/cluster"

interface ClusterBreadcrumbProps {
  clusterId: string
  currentPage: string
}

export function ClusterBreadcrumb({ clusterId, currentPage }: ClusterBreadcrumbProps) {
  const [cluster, setCluster] = useState<ClusterConfig | null>(null)

  useEffect(() => {
    const fetchCluster = async () => {
      try {
        const response = await fetch(`/api/clusters/${clusterId}`)
        if (!response.ok) throw new Error("Failed to fetch cluster")
        const data = await response.json()
        setCluster(data)
      } catch (error) {
        console.error("Error fetching cluster:", error)
      }
    }

    fetchCluster()
  }, [clusterId])

  if (!cluster) return null

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Link 
        href="/" 
        className="hover:text-foreground transition-colors"
      >
        集群列表
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link 
        href={`/clusters/${clusterId}`}
        className="hover:text-foreground transition-colors"
      >
        {cluster.name}
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-foreground">{currentPage}</span>
    </div>
  )
} 