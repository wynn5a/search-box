"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { ClusterConfig } from "@/types/cluster"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "next-intl"

interface ClusterBreadcrumbProps {
  clusterId: string
  currentPage: string
  indexName?: string
}

export function ClusterBreadcrumb({ clusterId, currentPage, indexName }: ClusterBreadcrumbProps) {
  const t = useTranslations()
  const [cluster, setCluster] = useState<ClusterConfig | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchCluster = async () => {
      try {
        const response = await fetch(`/api/clusters/${clusterId}`)
        if (!response.ok) throw new Error("Failed to fetch cluster")
        const data = await response.json()
        if (!data.id) throw new Error("Invalid cluster data")
        setCluster(data)
      } catch (error) {
        console.error("Error fetching cluster:", error)
        toast({
          title: t("cluster.breadcrumb.load_failed.title"),
          description: t("cluster.breadcrumb.load_failed.description"),
          variant: "destructive",
        })
      }
    }

    fetchCluster()
  }, [clusterId])

  if (!cluster) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link 
          href="/clusters" 
          className="hover:text-foreground transition-colors"
        >
          {t("cluster.breadcrumb.clusters")}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{t("cluster.breadcrumb.loading")}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Link 
        href="/clusters" 
        className="hover:text-foreground transition-colors"
      >
        {t("cluster.breadcrumb.clusters")}
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link 
        href={indexName ? `/clusters/${clusterId}/indices` : `/clusters/${clusterId}`}
        className="hover:text-foreground transition-colors"
      >
        {cluster.name}
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-foreground">{currentPage}</span>
    </div>
  )
}