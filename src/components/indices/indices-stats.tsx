"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Database, HardDrive, Files, AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations } from 'next-intl'
import { ConnectionErrorGrid } from "@/components/cluster/connection-error-state"

interface IndexStats {
  health: string
  status: string
  index: string
  uuid: string
  pri: number
  rep: number
  "docs.count": number
  "docs.deleted": number
  "store.size": string
  "pri.store.size": string
}

interface StatsCardProps {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  loading?: boolean
}

function StatsCard({ title, value, description, icon, loading }: StatsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-primary/10 rounded-full">
              {icon}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-6 w-[120px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="px-6 py-4">
        <div className="flex items-center space-x-6">
          <div className="p-2 bg-primary/10 rounded-full shrink-0">
            {icon}
          </div>
          <div className="space-y-1 min-w-0 pl-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-xl font-bold truncate">{value}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground pt-2 ml-2">{description}</p>
      </CardContent>
    </Card>
  )
}

export function IndicesStats({ clusterId }: { clusterId: string }) {
  const [indices, setIndices] = useState<IndexStats[]>([])
  const [totalDocs, setTotalDocs] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)
  const { toast } = useToast()
  const t = useTranslations('clusters')

  const formatNumber = useCallback((value: number) => {
    if (!value && value !== 0) return { mainValue: "0", fullValue: "0" }
    
    if (value >= 1_000_000) {
      return {
        mainValue: (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M',
        fullValue: value.toLocaleString('zh-CN')
      }
    }
    if (value >= 1_000) {
      return {
        mainValue: (value / 1_000).toFixed(1).replace(/\.0$/, '') + 'K',
        fullValue: value.toLocaleString('zh-CN')
      }
    }
    return {
      mainValue: value.toString(),
      fullValue: value.toLocaleString('zh-CN')
    }
  }, [])

  const formatSize = useCallback((size: string) => {
    if (!size) return "0 B"
    const units = ["B", "KB", "MB", "GB", "TB"]
    let value = parseFloat(size)
    let unitIndex = 0
    
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024
      unitIndex++
    }
    
    return `${value.toFixed(2)} ${units[unitIndex]}`
  }, [])

  const getTotalSize = useCallback(() => {
    return indices.reduce((acc, curr) => {
      const size = curr["store.size"] || "0b"
      const value = parseFloat(size)
      return acc + (isNaN(value) ? 0 : value)
    }, 0)
  }, [indices])

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const [indicesResponse, docsResponse] = await Promise.all([
        fetch(`/api/clusters/${clusterId}/indices`),
        fetch(`/api/clusters/${clusterId}/indices/count`)
      ])

      if (!indicesResponse.ok || !docsResponse.ok) {
        throw new Error("Failed to fetch cluster statistics")
      }

      const indicesData = await indicesResponse.json()
      const docsData = await docsResponse.json()

      if (indicesData.success && Array.isArray(indicesData.data)) {
        setIndices(indicesData.data)
      }

      if (docsData.success && Array.isArray(docsData.data) && docsData.data.length > 0) {
        setTotalDocs(docsData.data[0].count)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('list.test.error')
      setError(message)
    } finally {
      setLoading(false)
      setRetrying(false)
    }
  }, [clusterId, t])

  const handleRetry = useCallback(() => {
    setRetrying(true)
    fetchData()
  }, [fetchData])

  useEffect(() => {
    setLoading(true)
    fetchData()
  }, [clusterId, fetchData])

  const stats = {
    totalIndices: indices.length,
    userIndices: indices.filter(i => !i.index.startsWith('.')).length,
    systemIndices: indices.filter(i => i.index.startsWith('.')).length,
    totalDocs,
    totalSize: getTotalSize(),
    healthStatus: {
      green: indices.filter(i => i.health === "green").length,
      yellow: indices.filter(i => i.health === "yellow").length,
      red: indices.filter(i => i.health === "red").length,
    }
  }

  if (error) {
    return (
      <ConnectionErrorGrid
        onRetry={handleRetry}
        retrying={retrying}
        columns={4}
      />
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title={t('list.stats.total_indices')}
        value={stats.totalIndices.toString()}
        description={`${t('list.stats.user_indices')}: ${stats.userIndices} / ${t('list.stats.system_indices')}: ${stats.systemIndices}`}
        icon={<Database className="h-4 w-4 text-primary" />}
        loading={loading}
      />
      <StatsCard
        title={t('list.stats.total_docs')}
        value={formatNumber(stats.totalDocs).mainValue}
        description={t('list.stats.total_count', { count: formatNumber(stats.totalDocs).fullValue })}
        icon={<Files className="h-4 w-4 text-primary" />}
        loading={loading}
      />
      <StatsCard
        title={t('list.stats.storage_size')}
        value={formatSize(stats.totalSize.toString())}
        description={t('list.stats.storage_description')}
        icon={<HardDrive className="h-4 w-4 text-primary" />}
        loading={loading}
      />
      <StatsCard
        title={t('list.stats.health_status')}
        value={`${stats.healthStatus.green}/${stats.totalIndices}`}
        description={t('list.stats.health_description', { 
          yellow: stats.healthStatus.yellow,
          red: stats.healthStatus.red
        })}
        icon={<AlertCircle className="h-4 w-4 text-primary" />}
        loading={loading}
      />
    </div>
  )
}
