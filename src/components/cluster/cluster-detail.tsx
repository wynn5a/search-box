"use client"

import { useEffect, useState } from "react"
import { useRouter } from "@/routing"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft, ArrowRight, Search } from "lucide-react"
import { ClusterConfig } from "@/types/cluster"
import Link from "next/link"

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

        // 更新最近连接时间
        await fetch(`/api/clusters/${clusterId}/connect`, {
          method: 'POST'
        })

        // 获取集群统计信息
        const statsResponse = await fetch(`/api/clusters/${clusterId}/stats`)
        if (!statsResponse.ok) throw new Error("Failed to fetch cluster stats")
        const statsData = await statsResponse.json()
        if (statsData.success) {
          setStats(statsData.data)
        } else {
          throw new Error(statsData.error || "Failed to fetch stats")
        }
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
    switch (status?.toLowerCase()) {
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
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    if (bytes === 0) return "0 Byte"
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString())
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
  }

  // 提供默认值，避免空值错误
  const health = stats?.health || {
    status: 'unknown',
    number_of_nodes: 0,
    active_shards: 0,
    relocating_shards: 0,
    initializing_shards: 0,
    unassigned_shards: 0,
  }

  const indices = stats?.stats?.indices || {
    count: 0,
    docs: { count: 0 },
    store: { size_in_bytes: 0 },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clusters" className="hover:opacity-80">
          <Button
            variant="ghost"
            size="icon"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{cluster.name}</h1>
          <p className="text-muted-foreground">{cluster.url}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>集群状态</CardTitle>
            <CardDescription>当前集群的健康状态</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${getHealthColor(health.status)}`}>
              {health.status.toUpperCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>节点数量</CardTitle>
            <CardDescription>活跃的集群节点数</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{health.number_of_nodes}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>索引数量</CardTitle>
            <CardDescription>当前集群中的索引总数</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-2xl font-bold">{indices.count}</p>
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
              {indices.docs.count.toLocaleString()}
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
              {formatBytes(indices.store.size_in_bytes)}
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
                <span className="font-bold">{health.active_shards}</span>
              </div>
              <div className="flex justify-between">
                <span>迁移中</span>
                <span className="font-bold">{health.relocating_shards}</span>
              </div>
              <div className="flex justify-between">
                <span>初始化中</span>
                <span className="font-bold">{health.initializing_shards}</span>
              </div>
              <div className="flex justify-between">
                <span>未分配</span>
                <span className="font-bold">{health.unassigned_shards}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 