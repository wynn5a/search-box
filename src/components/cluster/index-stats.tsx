"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface IndexStatsProps {
  clusterId: string
  indexName: string
}

export function IndexStats({ clusterId, indexName }: IndexStatsProps) {
  const [stats, setStats] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchStats = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/clusters/${clusterId}/indices/${indexName}/stats`)
      if (!response.ok) throw new Error("Failed to fetch stats")
      const data = await response.json()
      if (!data.success) throw new Error(data.error || "Failed to fetch stats")
      
      setStats(data.data)
    } catch (error) {
      toast({
        title: "获取索引统计信息失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [clusterId, indexName])

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">统计信息</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={refreshing}
        >
          <RefreshCw className={cn(
            "h-4 w-4 mr-2",
            refreshing && "animate-spin"
          )} />
          刷新
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">文档</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="text-2xl font-bold">
                  {formatNumber(stats?._all?.primaries?.docs?.count || 0)}
                </div>
                <p className="text-xs text-muted-foreground">总文档数</p>
              </div>
              <div>
                <div className="text-sm font-medium">
                  {formatNumber(stats?._all?.primaries?.docs?.deleted || 0)}
                </div>
                <p className="text-xs text-muted-foreground">已删除文档</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">存储</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="text-2xl font-bold">
                  {formatBytes(stats?._all?.total?.store?.size_in_bytes || 0)}
                </div>
                <p className="text-xs text-muted-foreground">总存储大小</p>
              </div>
              <div>
                <div className="text-sm font-medium">
                  {formatBytes(stats?._all?.primaries?.store?.size_in_bytes || 0)}
                </div>
                <p className="text-xs text-muted-foreground">主分片大小</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">分片</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="text-2xl font-bold">
                  {stats?._shards?.total || 0}
                </div>
                <p className="text-xs text-muted-foreground">总分片数</p>
              </div>
              <div className="flex justify-between">
                <div>
                  <div className="text-sm font-medium">
                    {stats?._shards?.successful || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">成功</p>
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {stats?._shards?.failed || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">失败</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 