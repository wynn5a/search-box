"use client"

import { useState, useEffect } from "react"
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
import { Trash2, RefreshCw, Loader2 } from "lucide-react"
import type { ClusterConfig } from "@/types/cluster"
import { eventBus, EVENTS } from "@/lib/events"

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

  const fetchClusters = async () => {
    try {
      const response = await fetch("/api/clusters")
      if (!response.ok) throw new Error("Failed to fetch clusters")
      const data = await response.json()
      const clustersData = data.success ? data.data : []
      
      setClusters(clustersData.map((cluster: ClusterConfig) => ({
        ...cluster,
        health: { status: 'unknown' }
      })))
      setLoading(false)

      clustersData.forEach((cluster: ClusterConfig) => {
        fetchClusterHealth(cluster.id)
      })
    } catch (error) {
      toast({
        title: "获取集群列表失败",
        description: "请稍后重试",
        variant: "destructive",
      })
      setClusters([])
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

    // 监听集群变更事件
    const handleClusterAdded = () => fetchClusters()
    const handleClusterUpdated = () => fetchClusters()
    const handleClusterDeleted = () => fetchClusters()

    eventBus.on(EVENTS.CLUSTER_ADDED, handleClusterAdded)
    eventBus.on(EVENTS.CLUSTER_UPDATED, handleClusterUpdated)
    eventBus.on(EVENTS.CLUSTER_DELETED, handleClusterDeleted)

    // 定时刷新
    const interval = setInterval(fetchClusters, 60000)

    return () => {
      clearInterval(interval)
      eventBus.off(EVENTS.CLUSTER_ADDED, handleClusterAdded)
      eventBus.off(EVENTS.CLUSTER_UPDATED, handleClusterUpdated)
      eventBus.off(EVENTS.CLUSTER_DELETED, handleClusterDeleted)
    }
  }, [])

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
        body: JSON.stringify({
          url: cluster.url,
          username: cluster.username,
          password: cluster.password,
        }),
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

  if (loading) {
    return <div>加载集群列表中...</div>
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>状态</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>连接信息</TableHead>
              <TableHead>最近连接</TableHead>
              <TableHead>添加时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clusters.map((cluster) => (
              <TableRow 
                key={cluster.id}
                className="cursor-pointer"
                onClick={() => router.push(`/clusters/${cluster.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${getStatusColor(cluster.health?.status)}`}>
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
                      <Badge variant="outline">
                        {cluster.username ? "Basic Auth" : "无认证"}
                      </Badge>
                      {cluster.sshEnabled && (
                        <Badge variant="secondary">
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
                              <RefreshCw className="h-4 w-4" />
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
                            <Trash2 className="h-4 w-4 text-red-500" />
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
        onOpenChange={() => setClusterToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除集群</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除集群 "{clusterToDelete?.name}" 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clusterToDelete && deleteCluster(clusterToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 