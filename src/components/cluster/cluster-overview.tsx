"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Database, HardDrive, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { ConnectionErrorGrid } from "./connection-error-state"

interface ClusterStats {
  health: {
    status: string
    number_of_nodes: number
    active_shards: number
    relocating_shards: number
    initializing_shards: number
    unassigned_shards: number
  }
  stats: {
    indices: {
      count: number
      total: {
        docs: {
          count: number
        }
        store: {
          size_in_bytes: number
        }
      }
    }
  }
}

interface ClusterOverviewProps {
  clusterId: string
}

export function ClusterOverview({ clusterId }: ClusterOverviewProps) {
  const t = useTranslations()
  const [stats, setStats] = useState<ClusterStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/clusters/${clusterId}/stats`)
      if (!response.ok) throw new Error("Failed to fetch cluster stats")
      const data = await response.json()
      if (!data.success) throw new Error(data.error || "Failed to fetch stats")
      setStats(data.data)
      setError(null)
    } catch (error) {
      setError(t("cluster.overview.error.load_failed"))
      console.error(error)
    } finally {
      setLoading(false)
      setRetrying(false)
    }
  }, [clusterId, t])

  const handleRetry = useCallback(() => {
    setRetrying(true)
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (loading && !retrying) {
    return <ClusterOverviewSkeleton />
  }

  if (error || !stats) {
    return (
      <ConnectionErrorGrid
        onRetry={handleRetry}
        retrying={retrying}
        columns={4}
      />
    )
  }

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const safeGet = (obj: any, path: string[], defaultValue: any = 0) => {
    return path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : defaultValue), obj)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("cluster.overview.status.title")}</CardTitle>
          <Badge
            variant={safeGet(stats, ['health', 'status']) === "green" ? "default" : "destructive"}
            className={cn(
              "capitalize",
              safeGet(stats, ['health', 'status']) === "yellow" && "bg-yellow-500"
            )}
          >
            {safeGet(stats, ['health', 'status'], 'unknown')}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {t("cluster.overview.status.nodes", { count: safeGet(stats, ['health', 'number_of_nodes']) })}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("cluster.overview.version") + ' ' + safeGet(stats, ['stats', 'nodes', 'versions'])}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("cluster.overview.indices.title")}</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(safeGet(stats, ['stats', 'indices', 'count']))}
          </div>
          {safeGet(stats, ['stats', 'indices', 'docs', 'count']) > 0 && (
            <p className="text-xs text-muted-foreground">
              {t("cluster.overview.indices.docs", {
                count: formatNumber(safeGet(stats, ['stats', 'indices', 'docs', 'count']))
              })}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("cluster.overview.storage.title")}</CardTitle>
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatBytes(safeGet(stats, ['stats', 'indices', 'store', 'size_in_bytes']))}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("cluster.overview.storage.total")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("cluster.overview.shards.title")}</CardTitle>
          <Layers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{safeGet(stats, ['health', 'active_shards'])}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            {safeGet(stats, ['health', 'relocating_shards']) > 0 && (
              <span>{t("cluster.overview.shards.relocating", {
                count: safeGet(stats, ['health', 'relocating_shards'])
              })}</span>
            )}
            {safeGet(stats, ['health', 'initializing_shards']) > 0 && (
              <span>{t("cluster.overview.shards.initializing", {
                count: safeGet(stats, ['health', 'initializing_shards'])
              })}</span>
            )}
            {safeGet(stats, ['health', 'unassigned_shards']) > 0 && (
              <span className="text-destructive">{t("cluster.overview.shards.unassigned", {
                count: safeGet(stats, ['health', 'unassigned_shards'])
              })}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ClusterOverviewSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array(4).fill(0).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-[100px] mb-2" />
            <Skeleton className="h-3 w-[140px]" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}