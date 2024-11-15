"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Database, HardDrive, Layers } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const [stats, setStats] = useState<ClusterStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/clusters/${clusterId}/stats`)
      if (!response.ok) throw new Error("Failed to fetch cluster stats")
      const data = await response.json()
      if (!data.success) throw new Error(data.error || "Failed to fetch stats")
      console.log(data.data)
      setStats(data.data)
      setError(null)
    } catch (error) {
      setError("获取集群统计信息失败")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [clusterId])

  if (loading) {
    return <ClusterOverviewSkeleton />
  }

  if (error || !stats) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>错误</AlertTitle>
        <AlertDescription>{error || "无法加载集群统计信息"}</AlertDescription>
      </Alert>
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
          <CardTitle className="text-sm font-medium">集群状态</CardTitle>
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
          <div className="text-2xl font-bold">{safeGet(stats, ['health', 'number_of_nodes'])} 个节点</div>
          <p className="text-xs text-muted-foreground">
            {safeGet(stats, ['health', 'active_shards'])} 活动分片
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">索引数量</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(safeGet(stats, ['stats', 'indices', 'count']))}
          </div>
          {safeGet(stats, ['stats', 'indices', 'docs', 'count']) > 0 && (
            <p className="text-xs text-muted-foreground">
              {formatNumber(safeGet(stats, ['stats', 'indices', 'docs', 'count']))} 个文档
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">存储大小</CardTitle>
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatBytes(safeGet(stats, ['stats', 'indices', 'store', 'size_in_bytes']))}
          </div>
          <p className="text-xs text-muted-foreground">
            总存储空间
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">分片状态</CardTitle>
          <Layers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{safeGet(stats, ['health', 'active_shards'])}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            {safeGet(stats, ['health', 'relocating_shards']) > 0 && (
              <span>{safeGet(stats, ['health', 'relocating_shards'])} 迁移中</span>
            )}
            {safeGet(stats, ['health', 'initializing_shards']) > 0 && (
              <span>{safeGet(stats, ['health', 'initializing_shards'])} 初始化中</span>
            )}
            {safeGet(stats, ['health', 'unassigned_shards']) > 0 && (
              <span className="text-destructive">{safeGet(stats, ['health', 'unassigned_shards'])} 未分配</span>
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