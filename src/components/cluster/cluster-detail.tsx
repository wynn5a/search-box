"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft, ArrowRight, Search } from "lucide-react"
import { ClusterConfig } from "@/types/cluster"

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
      docs: {
        count: number
      }
      store: {
        size_in_bytes: number
      }
    }
  }
}

export function ClusterDetail({ clusterId }: { clusterId: string }) {
  const [cluster, setCluster] = useState<ClusterConfig | null>(null)
  const [stats, setStats] = useState<ClusterStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchClusterInfo = async () => {
      try {
        // 获取集群基本信息
        const clusterResponse = await fetch(`/api/clusters/${clusterId}`)
        if (!clusterResponse.ok) throw new Error("Failed to fetch cluster info")
        const clusterData = await clusterResponse.json()
        setCluster(clusterData)

        // 获取集群统计信息
        const statsResponse = await fetch(`/api/clusters/${clusterId}/stats`)
        if (!statsResponse.ok) throw new Error("Failed to fetch cluster stats")
        const statsData = await statsResponse.json()
        setStats(statsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchClusterInfo()
    const interval = setInterval(fetchClusterInfo, 30000)
    return () => clearInterval(interval)
  }, [clusterId])

  if (loading) {
    return <div>加载集群信息中...</div>
  }

  if (error || !cluster) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>错误</AlertTitle>
        <AlertDescription>{error || "集群不存在"}</AlertDescription>
      </Alert>
    )
  }

  const getHealthColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "green":
        return "text-green-500"
      case "yellow":
        return "text-yellow-500"
      case "red":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  const formatBytes = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Byte";
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{cluster.name}</h1>
          <p className="text-muted-foreground">{cluster.url}</p>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>集群状态</CardTitle>
              <CardDescription>当前集群的健康状态</CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${getHealthColor(stats.health.status)}`}>
                {stats.health.status.toUpperCase()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>节点数量</CardTitle>
              <CardDescription>活跃的集群节点数</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.health.number_of_nodes}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>索引数量</CardTitle>
              <CardDescription>当前集群中的索引总数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-2xl font-bold">{stats.stats.indices.count}</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/clusters/${clusterId}/indices`)}
              >
                <span>管理索引</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>文档数量</CardTitle>
              <CardDescription>所有索引中的文档总数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-2xl font-bold">
                {stats.stats.indices.docs.count.toLocaleString()}
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/clusters/${clusterId}/query`)}
              >
                <Search className="mr-2 h-4 w-4" />
                <span>查询数据</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>存储大小</CardTitle>
              <CardDescription>索引占用的总存储空间</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatBytes(stats.stats.indices.store.size_in_bytes)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>分片状态</CardTitle>
              <CardDescription>集群中的分片分布情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>活跃分片</span>
                  <span className="font-bold">{stats.health.active_shards}</span>
                </div>
                <div className="flex justify-between">
                  <span>迁移中</span>
                  <span className="font-bold">{stats.health.relocating_shards}</span>
                </div>
                <div className="flex justify-between">
                  <span>初始化中</span>
                  <span className="font-bold">{stats.health.initializing_shards}</span>
                </div>
                <div className="flex justify-between">
                  <span>未分配</span>
                  <span className="font-bold">{stats.health.unassigned_shards}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 