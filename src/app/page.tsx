import { Suspense } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StatsCard } from "@/components/dashboard/stats-card"
import { HealthChart } from "@/components/dashboard/health-chart"
import { ClusterCard } from "@/components/cluster/cluster-card"
import { AddClusterDialog } from "@/components/cluster/add-cluster-dialog"
import { Button } from "@/components/ui/button"
import { Database, Server, HardDrive, Settings } from "lucide-react"
import { clusterService } from "@/lib/services/cluster-service"
import Link from "next/link"
import { formatBytes } from "@/lib/utils"

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
    <div className="flex flex-col gap-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted"></div>
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

export default async function Home() {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingState />}>
        <ClusterOverviewContent />
      </Suspense>
    </DashboardLayout>
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">集群概览</h1>
        <div className="flex items-center gap-2">
          <Link href="/clusters">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              集群管理
            </Button>
          </Link>
          <AddClusterDialog />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="集群总数"
          value={summary.totalClusters}
          description="所有已添加的集群数量"
          icon={Server}
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

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">集群列表</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>健康</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span>警告</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span>异常</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          管理所有已添加的 OpenSearch 集群，点击卡片可以查看详细信息
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clusters.map((cluster) => (
          <ClusterCard key={cluster.id} cluster={cluster} />
        ))}
      </div>
    </div>
  )
} 