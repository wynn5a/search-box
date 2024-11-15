"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { Trash2, RefreshCw, Loader2, Network, Nfc, ChevronDown, ChevronUp } from "lucide-react"
import type { ClusterConfig } from "@/types/cluster"
import { eventBus, EVENTS } from "@/lib/events"
import { cn } from "@/lib/utils"
import { AddClusterButton } from "@/components/cluster/add-cluster-button"
import { Database } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface ClusterWithHealth extends ClusterConfig {
  health?: {
    status: string
  }
  lastConnected?: Date | null
}

export function ClustersList() {
  const [clusters, setClusters] = useState<ClusterWithHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [healthLoading, setHealthLoading] = useState<Record<string, boolean>>({})
  const [testingCluster, setTestingCluster] = useState<string | null>(null)
  const [clusterToDelete, setClusterToDelete] = useState<ClusterConfig | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'created'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const fetchClusters = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/clusters")
      if (!response.ok) throw new Error("Failed to fetch clusters")
      const data = await response.json()
      console.log(data)
      const clustersData = data.success ? data.data : []
      
      setClusters(clustersData.map((cluster: ClusterConfig) => ({
        ...cluster
      })))
    } catch (error) {
      toast({
        title: "获取集群列表失败",
        description: "请稍后重试",
        variant: "destructive",
      })
      setClusters([])
    } finally {
      setLoading(false)
    }
  }

  const fetchClusterHealth = async (clusterId: string) => {
    setHealthLoading(prev => ({ ...prev, [clusterId]: true }))
    try {
      const healthResponse = await fetch(`/api/clusters/${clusterId}/stats`)
      if (!healthResponse.ok) throw new Error("Failed to fetch health")
      const healthData = await healthResponse.json()
      
      setClusters(prev => prev.map(cluster => 
        cluster.id === clusterId ? {
          ...cluster,
          health: {
            status: healthData.data?.health?.status || 'unknown'
          }
        } : cluster
      ))
    } catch (error) {
      console.error(`Failed to fetch health for cluster ${clusterId}:`, error)
    } finally {
      setHealthLoading(prev => ({ ...prev, [clusterId]: false }))
    }
  }

  useEffect(() => {
    fetchClusters()

    const handleClusterAdded = () => {
      fetchClusters()
    }
    const handleClusterUpdated = () => {
      fetchClusters()
    }
    const handleClusterDeleted = () => {
      fetchClusters()
    }

    eventBus.on(EVENTS.CLUSTER_ADDED, handleClusterAdded)
    eventBus.on(EVENTS.CLUSTER_UPDATED, handleClusterUpdated)
    eventBus.on(EVENTS.CLUSTER_DELETED, handleClusterDeleted)

    return () => {
      eventBus.off(EVENTS.CLUSTER_ADDED, handleClusterAdded)
      eventBus.off(EVENTS.CLUSTER_UPDATED, handleClusterUpdated)
      eventBus.off(EVENTS.CLUSTER_DELETED, handleClusterDeleted)
    }
  }, [])

  const handleRefresh = () => {
    clusters.forEach(cluster => {
      fetchClusterHealth(cluster.id)
    })
  }

  const deleteCluster = async (cluster: ClusterConfig) => {
    try {
      const response = await fetch(`/api/clusters/${cluster.id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete cluster")
      
      toast({
        title: "集群已删除",
        description: "集群配置已成功删除",
      })
      
      fetchClusters()
    } catch (error) {
      toast({
        title: "删除集群失败",
        description: "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setClusterToDelete(null)
    }
  }

  const testClusterConnection = async (cluster: ClusterConfig) => {
    setTestingCluster(cluster.id)
    try {
      const response = await fetch("/api/clusters/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cluster),
      })

      const result = await response.json()
      
      toast({
        title: result.success ? "连接成功" : "连接失败",
        description: result.success 
          ? "可以正常连接到集群" 
          : "无法连接到集群，请检查配置",
        variant: result.success ? "default" : "destructive",
      })
    } catch (error) {
      toast({
        title: "测试连接失败",
        description: error instanceof Error && error.message === 'AbortError' 
          ? "连接超时，请检查网络或集群地址" 
          : "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setTestingCluster(null)
    }
  }

  const getStatusColor = (status?: string) => {
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

  const getStatusText = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "green":
        return "健康"
      case "yellow":
        return "警告"
      case "red":
        return "异常"
      default:
        return "未知"
    }
  }

  const formatLastConnected = (timestamp?: Date | null) => {
    if (!timestamp) return '从未连接'
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    // 如果在1分钟内
    if (diff < 60000) {
      return '刚刚'
    }
    // 如果在1小时内
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return `${minutes}分钟前`
    }
    // 如果在24小时内
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      return `${hours}小时前`
    }
    // 如果在7天内
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000)
      return `${days}天前`
    }
    // 其他情况显示完整日期
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const sortedClusters = useMemo(() => {
    return [...clusters].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return sortOrder === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name)
        case 'status':
          return sortOrder === 'asc'
            ? (a.health?.status || '').localeCompare(b.health?.status || '')
            : (b.health?.status || '').localeCompare(a.health?.status || '')
        case 'created':
          return sortOrder === 'asc'
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })
  }, [clusters, sortBy, sortOrder])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-8" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="rounded-lg border">
          <div className="p-4 space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-4 w-[60%]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (clusters.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] rounded-lg border border-dashed">
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
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Network className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">集群列表</h2>
          <Badge variant="secondary">{clusters.length}</Badge>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleRefresh}
          disabled={Object.values(healthLoading).some(Boolean)}
        >
          <RefreshCw className={cn(
            "h-4 w-4 mr-2",
            Object.values(healthLoading).some(Boolean) && "animate-spin"
          )} />
          刷新状态
        </Button>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  if (sortBy === 'status') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  } else {
                    setSortBy('status')
                    setSortOrder('asc')
                  }
                }}
              >
                状态 {sortBy === 'status' && sortOrder === 'asc' && <ChevronDown className="inline h-4 w-4 ml-1" />}
                {sortBy === 'status' && sortOrder === 'desc' && <ChevronUp className="inline h-4 w-4 ml-1" />}
              </TableHead>
              <TableHead>名称</TableHead>
              <TableHead>连接信息</TableHead>
              <TableHead>最近连接</TableHead>
              <TableHead>添加时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedClusters.map((cluster) => (
              <TableRow 
                key={cluster.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/clusters/${cluster.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      {
                        "bg-green-500": cluster.health?.status === "green",
                        "bg-yellow-500": cluster.health?.status === "yellow",
                        "bg-red-500": cluster.health?.status === "red",
                        "bg-gray-500": !cluster.health?.status
                      }
                    )} />
                    <span className={cn(
                      "font-medium",
                      getStatusColor(cluster.health?.status)
                    )}>
                      {getStatusText(cluster.health?.status)}
                    </span>
                    {healthLoading[cluster.id] && (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{cluster.name}</span>
                    <span className="text-xs text-muted-foreground">{cluster.url}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-normal">
                        {cluster.username ? "Basic Auth" : "无认证"}
                      </Badge>
                      {cluster.sshEnabled && (
                        <Badge variant="secondary" className="font-normal">
                          SSH 隧道
                        </Badge>
                      )}
                    </div>
                    {cluster.sshEnabled && (
                      <span className="text-xs text-muted-foreground">
                        {cluster.sshUser}@{cluster.sshHost}:{cluster.sshPort}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatLastConnected(cluster.lastConnected)}
                  </span>
                </TableCell>
                <TableCell>
                  {cluster.createdAt ? new Date(cluster.createdAt).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => testClusterConnection(cluster)}
                            disabled={testingCluster === cluster.id}
                          >
                            {testingCluster === cluster.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Nfc className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{testingCluster === cluster.id ? "测试中..." : "测试连接"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setClusterToDelete(cluster)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>删除集群</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog 
        open={!!clusterToDelete} 
        onOpenChange={(open) => !open && setClusterToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除集群</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除集群 "{clusterToDelete?.name}" ���？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clusterToDelete && deleteCluster(clusterToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 