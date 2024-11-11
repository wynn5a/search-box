"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Server, Database, HardDrive } from 'lucide-react'
import { eventBus } from "@/lib/events"
import { PieChart } from "@/components/ui/pie-chart"

interface ClusterSummary {
  totalClusters: number
  healthyClusters: number
  unhealthyClusters: number
  totalIndices: number
  totalStorage: number
}

export function ClusterOverview() {
  const [summary, setSummary] = useState<ClusterSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch('/api/clusters/summary')
        if (!response.ok) throw new Error('Failed to fetch clusters summary')
        const data = await response.json()
        if (data.success) {
          setSummary(data.data)
        } else {
          throw new Error(data.error || 'Failed to fetch summary')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
    const interval = setInterval(fetchSummary, 30000)
    const unsubscribe = eventBus.subscribe("clusterDefaultChanged", fetchSummary)

    return () => {
      clearInterval(interval)
      unsubscribe()
    }
  }, [])

  if (loading) {
    return <div>加载集群信息中...</div>
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!summary) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>暂无集群</AlertTitle>
        <AlertDescription>
          请添加集群以查看概览信息
        </AlertDescription>
      </Alert>
    )
  }

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Bytes'
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString())
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const pieData = [
    { label: '健康', value: summary.healthyClusters, color: '#22c55e' },
    { label: '异常', value: summary.unhealthyClusters, color: '#ef4444' },
  ]

  return (
    <div className="grid gap-4 grid-cols-5">
      <div className="col-span-3 grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              集群总数
            </CardTitle>
            <CardDescription>所有已添加的集群数量</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalClusters.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              索引总数
            </CardTitle>
            <CardDescription>所有集群的索引总数</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalIndices.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              总存储空间
            </CardTitle>
            <CardDescription>所有集群的存储空间总和</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBytes(summary.totalStorage)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>集群健康状态分布</CardTitle>
          <CardDescription>集群健康状态统计</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <PieChart data={pieData} width={200} height={200} />
          <div className="flex gap-6">
            {pieData.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.label}：{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 