"use client"

import { useEffect, useState } from "react"
import { ClusterOverview } from "./cluster-overview"

import { ClusterConfig } from "@/types/cluster"
import { Button } from "@/components/ui/button"
import { Database, Settings } from "lucide-react"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AddClusterButton } from "@/components/cluster/add-cluster-button"

interface ClusterSummary {
  totalClusters: number
  healthyClusters: number
  unhealthyClusters: number
  totalIndices: number
  totalStorage: number
}

export function ClusterOverviewContent() {
  const [clusters, setClusters] = useState<ClusterConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchClusters() {
      try {
        const response = await fetch('/api/clusters')
        if (!response.ok) {
          throw new Error('Failed to fetch clusters')
        }
        const result = await response.json()
        if (result.success) {
          setClusters(result.data)
        } else {
          throw new Error(result.error || 'Failed to fetch clusters')
        }
      } catch (error) {
        console.error('Failed to fetch clusters:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClusters()
  }, [])

  if (loading) {
    return <LoadingState />
  }

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
            <div className="space-y-6 p-6 pt-0">
              {clusters.map((cluster) => (
                <div key={cluster.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-semibold tracking-tight">
                        {cluster.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {cluster.url}
                      </p>
                    </div>
                    <div>
                      <Link href={`/clusters/${cluster.id}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Settings className="h-4 w-4" />
                          管理
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <ClusterOverview clusterId={cluster.id} />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-none p-6 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-48 bg-muted rounded mt-2 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-24 bg-muted rounded animate-pulse" />
            <div className="h-10 w-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <div className="space-y-6 p-6 pt-0">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-64 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-9 w-20 bg-muted rounded animate-pulse" />
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="bg-card rounded-lg border p-6 animate-pulse">
                    <div className="h-4 w-24 bg-muted rounded mb-4" />
                    <div className="h-8 w-16 bg-muted rounded mb-2" />
                    <div className="h-4 w-32 bg-muted rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
