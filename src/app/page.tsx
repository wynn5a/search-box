import { Suspense } from "react"
import { ClusterCard } from "@/components/cluster/cluster-card"
import { Button } from "@/components/ui/button"
import { Database, HardDrive, Settings, Activity } from "lucide-react"
import { clusterService } from "@/lib/services/cluster-service"
import Link from "next/link"
import { formatBytes } from "@/lib/utils"
import { AddClusterButton } from "@/components/cluster/add-cluster-button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

async function getClusters() {
  const clusters = await clusterService.getAllClusters()
  return clusters
}

async function getSummary() {
  const clusters = await clusterService.getAllClusters()
  
  let totalIndices = 0
  let totalStorage = 0
  let healthyClusters = 0
  let unhealthyClusters = 0

  clusters.forEach(cluster => {
    // 计算索引总数
    if (cluster.stats?.indices?.count) {
      totalIndices += cluster.stats.indices.count
    }

    // 计算存储空间
    if (cluster.stats?.indices?.store?.size_in_bytes) {
      totalStorage += cluster.stats.indices.store.size_in_bytes
    }

    // 计算健康状态
    if (cluster.health?.status === 'green' || cluster.health?.status === 'yellow') {
      healthyClusters++
    } else {
      unhealthyClusters++
    }
  })

  return {
    totalClusters: clusters.length,
    healthyClusters,
    unhealthyClusters,
    totalIndices,
    totalStorage,
  }
}

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

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Home() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ClusterOverviewContent />
    </Suspense>
  )
}

async function ClusterOverviewContent() {
  const clusters = await getClusters()
  const summary = await getSummary()

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none p-6 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">集群概览</h1>
            <p className="text-muted-foreground">
              管理和监控您的 OpenSearch 集群
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AddClusterButton />
            <Link href="/clusters">
              <Button variant="outline" size="default" className="gap-2">
                <Settings className="h-4 w-4" />
                集群管理
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {summary && (
        <div className="flex-none grid gap-4 p-6 pt-0 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">集群健康度</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-2xl font-bold">{summary.healthyClusters}/{summary.totalClusters}</div>
                  <p className="text-xs text-muted-foreground">健康集群比例</p>
                </div>
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all" 
                      style={{ 
                        width: `${(summary.healthyClusters / summary.totalClusters) * 100}%` 
                      }} 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">索引总数</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalIndices}</div>
              <p className="text-xs text-muted-foreground">所有集群的索引总数</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">存储空间</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(summary.totalStorage)}</div>
              <p className="text-xs text-muted-foreground">总存储空间使用量</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col gap-1 p-6 pt-1">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">集群列表</h2>
            <p className="text-sm text-muted-foreground">
              管理所有已添加的 OpenSearch 集群，点击卡片可以查看详细信息
            </p>
          </div>
        </div>
      </div>

      {clusters.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
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
      ) : (
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="grid gap-4 p-6 pt-0 md:grid-cols-2 lg:grid-cols-3">
              {clusters.map((cluster) => (
                <ClusterCard key={cluster.id} cluster={cluster} />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}