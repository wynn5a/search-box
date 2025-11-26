"use client"

import { useEffect, useState } from "react"
import { ClusterCard } from "@/components/cluster/cluster-card"
import { Button } from "@/components/ui/button"
import { Database, HardDrive, Activity, RefreshCw, Share2 } from "lucide-react"
import { formatBytes } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { ApiResponse, ClusterSummary } from "@/types/api"
import { ClusterOverview } from "@/types/cluster"
import { HealthFilter } from "@/types/filter"
import { useTranslations } from 'next-intl'
import { StatsCard } from "@/components/dashboard/stats-card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function LoadingState() {
  return (
    <div className="flex flex-col gap-6 p-8">
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
  const t = useTranslations('home.overview')
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
  const [healthFilter, setHealthFilter] = useState<HealthFilter>("all")

  async function getClusters(): Promise<ClusterOverview[]> {
    const response = await fetch("/api/clusters/overview")
    if (!response.ok) {
      toast({
        title: t('error.get_clusters.title'),
        description: t('error.get_clusters.description'),
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
        title: t('error.refresh.title'),
        description: t('error.refresh.description'),
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const filterClusters = (clusters: ClusterOverview[], search: string, health: HealthFilter) => {
    let filtered = clusters

    if (search) {
      filtered = filtered.filter(cluster =>
        cluster.name.toLowerCase().includes(search.toLowerCase()) ||
        cluster.url.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (health !== 'all') {
      filtered = filtered.filter(cluster => {
        if (health === 'healthy') {
          return cluster.health?.status === 'green' || cluster.health?.status === 'yellow'
        } else if (health === 'unhealthy') {
          return cluster.health?.status === 'red'
        }
        return true
      })
    }

    setFilteredClusters(filtered)
  }

  useEffect(() => {
    filterClusters(clusters, searchTerm, healthFilter)
  }, [clusters, searchTerm, healthFilter])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const clustersData = await getClusters()
        setClusters(clustersData)
        setFilteredClusters(clustersData)
        const summaryData = await getSummary(clustersData)
        setSummary(summaryData)
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast({
          title: t('error.get_clusters.title'),
          description: t('error.get_clusters.description'),
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <LoadingState />
  }

  return (
    <div className="flex h-full flex-col gap-4 py-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshData}
          disabled={refreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {t('button.refresh')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title={t('total_clusters')}
          value={summary.totalClusters}
          description={t('clusters_stats', {
            healthy: summary.healthyClusters,
            unhealthy: summary.unhealthyClusters
          })}
          icon={Activity}
        />
        <StatsCard
          title={t('total_indices')}
          value={summary.totalIndices}
          description={t('indices_stats')}
          icon={Database}
        />
        <StatsCard
          title={t('total_storage')}
          value={formatBytes(summary.totalStorage)}
          description={t('storage_stats')}
          icon={HardDrive}
        />
        <StatsCard
          title={t('shards_status')}
          value={summary.shards.active}
          description={t('shards.total', {
            active: summary.shards.active,
            total: summary.shards.total,
            percent: Math.round((summary.shards.active / summary.shards.total) * 100)
          })}
          icon={Share2}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b p-4">
          <div className="flex items-center justify-between space-x-4">
            <h2 className="text-lg font-semibold">{t('clusters')}</h2>
            <div className="flex flex-1 space-x-4 justify-end">
              <Input
                placeholder={t('search.placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-[300px]"
              />
              <Select
                value={healthFilter}
                onValueChange={(value) => setHealthFilter(value as HealthFilter)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('filter.health.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filter.health.all')}</SelectItem>
                  <SelectItem value="healthy">{t('filter.health.healthy')}</SelectItem>
                  <SelectItem value="unhealthy">{t('filter.health.unhealthy')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              {filteredClusters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-lg font-medium">{t('no_clusters')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('try_different_filter')}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredClusters.map((cluster) => (
                    <ClusterCard key={cluster.id} cluster={cluster} />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return <ClusterOverviewContent />
}