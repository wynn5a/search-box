import { Suspense } from "react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { HealthChart } from "@/components/dashboard/health-chart"
import { ClusterCard } from "@/components/cluster/cluster-card"
import { Button } from "@/components/ui/button"
import { Database, Server, HardDrive, Settings, ChevronRight } from "lucide-react"
import { clusterService } from "@/lib/services/cluster-service"
import Link from "next/link"
import { formatBytes } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { AddClusterButton } from "@/components/cluster/add-cluster-button"

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
  const [clusters, summary] = await Promise.all([
    getClusters(),
    getSummary(),
  ])

  const healthData = [
    { status: 'green', count: summary.healthyClusters },
    { status: 'red', count: summary.unhealthyClusters },
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">仪表盘</h1>
          <p className="text-sm text-muted-foreground">
            查看所有集群的概览信息和健康状态
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/clusters">
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              集群管理
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="集群总数"
          value={summary.totalClusters}
          description="所有已添加的集群数量"
          icon={Server}
          trend={{
            value: summary.healthyClusters,
            label: "健康集群",
            type: "success"
          }}
        />
        <StatsCard
          title="索引总数"
          value={summary.totalIndices}
          description="所有集群的索引总数"
          icon={Database}
        />
        <StatsCard
          title="总存储空间"
          value={formatBytes(summary.totalStorage)}
          description="所有集群的存储空间总和"
          icon={HardDrive}
        />
        <div className="md:col-span-2 lg:col-span-1">
          <HealthChart data={healthData} height={100} />
        </div>
      </div>

      <Separator className="my-2" />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">集群列表</h2>
            <p className="text-sm text-muted-foreground">
              管理所有已添加的 OpenSearch 集群，点击卡片可以查看详细信息
            </p>
          </div>
          <Link href="/clusters" className="group">
            <Button variant="ghost" size="sm" className="gap-2">
              查看全部
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>健康</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            <span>警告</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span>异常</span>
          </div>
        </div>
      </div>

      {clusters.length === 0 ? (
        <div className="flex items-center justify-center h-[200px] rounded-lg border border-dashed">
          <div className="flex flex-col items-center space-y-4 max-w-[420px] text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Database className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">没有集群</h3>
              <p className="text-sm text-muted-foreground">
                您还没有添加任何集群。添加一个集群来开始管理和监控您的 OpenSearch 服务。
              </p>
            </div>
            <AddClusterButton />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clusters.map((cluster) => (
            <ClusterCard key={cluster.id} cluster={cluster} />
          ))}
        </div>
      )}
    </div>
  )
} 