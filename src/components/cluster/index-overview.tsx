"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Database, HardDrive, Layers, Loader2, Power, PowerOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

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

interface IndexOverviewProps {
  clusterId: string
  indexName: string
}

export function IndexOverview({ clusterId, indexName }: IndexOverviewProps) {
  const [stats, setStats] = useState<IndexStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [operating, setOperating] = useState(false)
  const { toast } = useToast()
  const t = useTranslations('index.overview')

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/clusters/${clusterId}/indices`)
      if (!response.ok) throw new Error(t('error.fetch_failed'))
      const data = await response.json()
      if (!data.success) throw new Error(data.error || t('error.fetch_failed'))
      const indexStats = data.data.find((index: any) => index.index === indexName)
      if (!indexStats) throw new Error("Index not found")

      setStats(indexStats)
      setError(null)
    } catch (error) {
      setError(t('error.fetch_failed'))
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const toggleIndex = async () => {
    try {
      setOperating(true)
      const action = stats?.status === 'close' ? 'open' : 'close'
      const response = await fetch(`/api/clusters/${clusterId}/indices/${indexName}/${action}`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error(`Failed to ${action} index`)
      const data = await response.json()
      if (!data.success) throw new Error(data.error || `Failed to ${action} index`)

      toast({
        title: t(action === 'open' ? 'status.opened' : 'status.closed'),
        description: t('status.success_message', {
          name: indexName,
          action: action === 'open' ? t('status.opened').toLowerCase() : t('status.closed').toLowerCase()
        }),
      })

      await fetchStats()
    } catch (error) {
      toast({
        title: t('error.operation_failed'),
        description: error instanceof Error ? error.message : t('error.try_again'),
        variant: "destructive",
      })
    } finally {
      setOperating(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [clusterId, indexName])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[100px] mb-2" />
              <Skeleton className="h-3 w-[140px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('error.title')}</AlertTitle>
        <AlertDescription>{error || t('error.load_failed')}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-semibold tracking-tight">
          {indexName}
          <span className="ml-2 px-1 text-sm text-muted-foreground border rounded-md bg-muted">
            {stats.uuid}
          </span>
        </div>

        <Button
          variant={stats.status === 'close' ? "default" : "outline"}
          size="sm"
          onClick={toggleIndex}
          disabled={operating}
        >
          {operating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : stats.status === 'close' ? (
            <Power className="h-4 w-4 mr-2" />
          ) : (
            <PowerOff className="h-4 w-4 mr-2" />
          )}
          {t(stats.status === 'close' ? 'status.open' : 'status.close')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className={cn(
          "capitalize",
          stats.status.toLowerCase() === "close" && "border-yellow-900"
        )}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('status.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{stats.status.toLowerCase()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('shards.title')}</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pri} / {stats.rep}</div>
            <p className="text-xs text-muted-foreground">
              {t('shards.description')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('documents.title')}</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats["docs.count"]?.toLocaleString() ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {t('documents.deleted', { count: stats["docs.deleted"]?.toLocaleString() ?? 0 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('storage.title')}</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats["store.size"]}</div>
            <p className="text-xs text-muted-foreground">
              {t('storage.primary', { size: stats["pri.store.size"] })}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 