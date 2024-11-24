"use client"

import { useEffect, useState, Suspense } from "react"
import { ClusterCard } from "@/components/cluster/cluster-card"
import { Button } from "@/components/ui/button"
import { Database, HardDrive, Settings, Activity, Search, RefreshCw } from "lucide-react"
import Link from "next/link"
import { formatBytes } from "@/lib/utils"
import { AddClusterButton } from "@/components/cluster/add-cluster-button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ApiResponse, ClusterSummary } from "@/types/api"
import { ClusterOverview } from "@/types/cluster"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

function LoadingState() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded bg-muted"></div>
        <div className="flex gap-2">
          <div className="h-9 w-24 animate-pulse rounded bg-muted"></div>
          <div className="h-9 w-24 animate-pulse rounded bg-muted"></div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-muted"></div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-lg bg-muted"></div>
        ))}
      </div>
    </div>
  )
}

function ClusterOverviewContent() {
  const { toast } = useToast()
  const [clusters, setClusters] = useState<ClusterOverview[]>([])
  const [filteredClusters, setFilteredClusters] = useState<ClusterOverview[]>([])
  const [summary, setSummary] = useState<ClusterSummary>({
    totalClusters: 0,
    healthyClusters: 0,
    unhealthyClusters: 0,
    totalIndices: 0,
    totalStorage: 0,
    shards: {
      total: 0,
      active: 0,
      relocating: 0,
      initializing: 0,
      unassigned: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [healthFilter, setHealthFilter] = useState("all")

  async function getClusters(): Promise<ClusterOverview[]> {
    const response = await fetch("/api/clusters/overview")
    if (!response.ok) {
      toast({
        title: "获取集群概览失败",
        description: "请稍后再试",
        variant: "destructive",
      })
      return []
    }
    const data: ApiResponse<ClusterOverview[]> = await response.json()
    return data.success ? data.data || [] : []
  }

  async function getSummary(clusters: ClusterOverview[]): Promise<ClusterSummary> {
    let totalIndices = 0
    let totalStorage = 0
    let healthyClusters = 0
    let unhealthyClusters = 0
    let totalShards = 0
    let activeShards = 0
    let relocatingShards = 0
    let initializingShards = 0
    let unassignedShards = 0

    clusters.forEach(cluster => {
      if (cluster.stats?.indices?.count) {
        totalIndices += cluster.stats.indices.count
      }

      if (cluster.stats?.indices?.store?.size_in_bytes) {
        totalStorage += cluster.stats.indices.store.size_in_bytes
      }

      if (cluster.health?.status === 'green' || cluster.health?.status === 'yellow') {
        healthyClusters++
      } else {
        unhealthyClusters++
      }

      // 统计分片状态
      if (cluster.health) {
        const health = cluster.health
        totalShards += health.active_shards + health.relocating_shards + 
                      health.initializing_shards + health.unassigned_shards
        activeShards += health.active_shards
        relocatingShards += health.relocating_shards
        initializingShards += health.initializing_shards
        unassignedShards += health.unassigned_shards
      }
    })

    return {
      totalClusters: clusters.length,
      healthyClusters,
      unhealthyClusters,
      totalIndices,
      totalStorage,
      shards: {
        total: totalShards,
        active: activeShards,
        relocating: relocatingShards,
        initializing: initializingShards,
        unassigned: unassignedShards
      }
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    try {
      const clustersData = await getClusters()
      setClusters(clustersData)
      const summaryData = await getSummary(clustersData)
      setSummary(summaryData)
      filterClusters(clustersData, searchTerm, healthFilter)
    } catch (error) {
      console.error('Failed to refresh data:', error)
      toast({
        title: "刷新数据失败",
        description: "请稍后再试",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const filterClusters = (clusters: ClusterOverview[], search: string, health: string) => {
    let filtered = clusters
    
    if (search) {
      filtered = filtered.filter(cluster => 
        cluster.name.toLowerCase().includes(search.toLowerCase()) ||
        cluster.url.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (health !== 'all') {
      filtered = filtered.filter(cluster => cluster.health?.status === health)
    }

    setFilteredClusters(filtered)
  }

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const clustersData = await getClusters()
        setClusters(clustersData)
        console.log(clustersData)
        setFilteredClusters(clustersData)
        const summaryData = await getSummary(clustersData)
        setSummary(summaryData)
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast({
          title: "获取数据失败",
          description: "请稍后再试",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  useEffect(() => {
    filterClusters(clusters, searchTerm, healthFilter)
  }, [searchTerm, healthFilter, clusters])

  if (loading) {
    return <LoadingState />
  }

  const healthyPercentage = summary.totalClusters > 0
    ? (summary.healthyClusters / summary.totalClusters) * 100
    : 0

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">集群概览</h2>
            <p className="text-sm text-muted-foreground mt-1">
              管理和监控您的 OpenSearch 集群
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={refreshData}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Link href="/clusters">
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                管理集群
              </Button>
            </Link>
            <AddClusterButton />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">集群健康度</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{summary.healthyClusters} / {summary.totalClusters}</div>
                <Progress value={healthyPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {summary.unhealthyClusters} 个集群异常
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">索引数量</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalIndices}</div>
              <p className="text-xs text-muted-foreground">
                {clusters.length} 个集群
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">存储空间</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(summary.totalStorage)}</div>
              <p className="text-xs text-muted-foreground">
                总存储容量
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">分片状态</CardTitle>
              <div className="flex -space-x-2">
                <div className={`h-2 w-2 rounded-full ${summary.shards.unassigned > 0 ? 'bg-red-500' : 'bg-green-500'}`} />
                <div className={`h-2 w-2 rounded-full ${summary.shards.initializing > 0 ? 'bg-yellow-500' : 'bg-green-500'}`} />
                <div className={`h-2 w-2 rounded-full ${summary.shards.relocating > 0 ? 'bg-blue-500' : 'bg-green-500'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{summary.shards.active} / {summary.shards.total}</div>
                <Progress value={(summary.shards.active / summary.shards.total) * 100} className="h-2" />
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span>初始化: {summary.shards.initializing}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span>迁移中: {summary.shards.relocating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span>未分配: {summary.shards.unassigned}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>活跃: {summary.shards.active}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {clusters.length > 0 && (
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索集群名称或地址..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={healthFilter}
              onValueChange={setHealthFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="按健康状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="green">健康</SelectItem>
                <SelectItem value="yellow">警告</SelectItem>
                <SelectItem value="red">异常</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex-1">
          {clusters.length === 0 ? (
            <div className="flex flex-col items-center justify-center">
              <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
                <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                  <Database className="h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">没有集群</h3>
                  <p className="mb-4 mt-2 text-sm text-muted-foreground">
                    您还没有添加任何集群。添加一个集群来开始管理和监控您的 OpenSearch 服务。
                  </p>
                  <AddClusterButton />
                </div>
              </div>
            </div>
          ) : filteredClusters.length === 0 ? (
            <div className="flex flex-col items-center justify-center">
              <div className="flex h-[200px] shrink-0 items-center justify-center rounded-md border border-dashed border-muted-foreground/25">
                <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center px-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                  <h3 className="mt-3 text-lg font-semibold">未找到匹配的集群</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    尝试使用不同的搜索条件或筛选条件
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-25rem)] w-full rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                {filteredClusters.map((cluster) => (
                  <ClusterCard key={cluster.id} cluster={cluster} />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return <ClusterOverviewContent />
}