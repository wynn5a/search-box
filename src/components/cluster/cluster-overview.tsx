"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { formatBytes } from "@/lib/utils"
import { RefreshCw, Database, HardDrive, Info, Server } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"

interface ClusterStats {
  name: string
  version: string
  health: {
    status: string
    cluster_name: string
    number_of_nodes: number
  }
  stats: {
    indices: {
      count: number
      docs: {
        count: number
      }
      store: {
        size_in_bytes: number
        total_data_set_size_in_bytes: number
      }
    }
  }
}

export function ClusterOverview({ clusterId }: { clusterId: string }) {
  const [stats, setStats] = useState<ClusterStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchStats = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/clusters/${clusterId}/stats`)
      if (!response.ok) throw new Error("Failed to fetch cluster stats")
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      toast({
        title: "获取集群信息失败",
        description: "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [clusterId])

  const getHealthColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "green":
        return "bg-green-500 hover:bg-green-600"
      case "yellow":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "red":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const getHealthText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "green":
        return "集群运行正常"
      case "yellow":
        return "集群存在警告"
      case "red":
        return "集群状态异常"
      default:
        return "未知状态"
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[100px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[200px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  const usedSpace = stats.stats.indices.store.size_in_bytes
  const totalSpace = stats.stats.indices.store.total_data_set_size_in_bytes
  const spaceUsagePercentage = (usedSpace / totalSpace) * 100

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">{stats.name}</h2>
          <Badge variant="outline">v{stats.version}</Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className={getHealthColor(stats.health.status)}>
                  {stats.health.status.toUpperCase()}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getHealthText(stats.health.status)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? '刷新中...' : '刷新'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              节点信息
            </CardTitle>
            <CardDescription>集群节点状态</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">节点数量</span>
                <span className="font-medium">{stats.health.number_of_nodes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">集群名称</span>
                <span className="font-medium">{stats.health.cluster_name}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              数据概览
            </CardTitle>
            <CardDescription>索引和文档统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">索引数量</span>
                <span className="font-medium">{stats.stats.indices.count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">文档总数</span>
                <span className="font-medium">
                  {stats.stats.indices.docs.count.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              存储空间
            </CardTitle>
            <CardDescription>数据存储使用情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">已用空间</span>
                  <span className="font-medium">{formatBytes(usedSpace)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">总空间</span>
                  <span className="font-medium">{formatBytes(totalSpace)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>使用率</span>
                  <span>{spaceUsagePercentage.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${spaceUsagePercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 