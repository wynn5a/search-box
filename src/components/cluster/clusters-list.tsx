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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { Star, StarOff, Trash2, RefreshCw } from "lucide-react"
import type { ClusterConfig } from "@/types/cluster"
import { eventBus } from "@/lib/events"

export function ClustersList() {
  const [clusters, setClusters] = useState<ClusterConfig[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  const fetchClusters = async () => {
    try {
      const response = await fetch("/api/clusters")
      if (!response.ok) throw new Error("Failed to fetch clusters")
      const data = await response.json()
      setClusters(data)
    } catch (error) {
      toast({
        title: "获取集群列表失败",
        description: "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClusters()
  }, [])

  const setDefaultCluster = async (clusterId: string, isDefault: boolean) => {
    try {
      const response = await fetch(`/api/clusters/${clusterId}/default`, {
        method: "PUT",
      })
      if (!response.ok) throw new Error("Failed to set default cluster")
      await fetchClusters()
      toast({
        title: isDefault ? "已取消默认集群" : "默认集群已更新",
        description: isDefault ? "已取消该集群的默认状态" : "集群设置已成功更新",
      })
      eventBus.emit("clusterDefaultChanged")
    } catch (error) {
      toast({
        title: "设置默认集群失败",
        description: "请稍后重试",
        variant: "destructive",
      })
    }
  }

  const deleteCluster = async (cluster: ClusterConfig) => {
    if (!confirm("确定要删除这个集群配置吗？")) return

    try {
      const response = await fetch(`/api/clusters/${cluster.id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete cluster")
      await fetchClusters()
      toast({
        title: "集群已删除",
        description: "集群配置已成功删除",
      })
      if (cluster.isDefault) {
        eventBus.emit("clusterDefaultChanged")
      }
    } catch (error) {
      toast({
        title: "删除集群失败",
        description: "请稍后重试",
        variant: "destructive",
      })
    }
  }

  const testClusterConnection = async (cluster: ClusterConfig) => {
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
        description: "请稍后重试",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div>加载集群列表中...</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">状态</TableHead>
            <TableHead>名称</TableHead>
            <TableHead>地址</TableHead>
            <TableHead>认证方式</TableHead>
            <TableHead className="w-[150px]">添加时间</TableHead>
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
                {cluster.isDefault ? (
                  <Badge>默认</Badge>
                ) : null}
              </TableCell>
              <TableCell className="font-medium">{cluster.name}</TableCell>
              <TableCell>{cluster.url}</TableCell>
              <TableCell>
                {cluster.username ? "Basic Auth" : "无认证"}
              </TableCell>
              <TableCell>
                {new Date(cluster.createdAt).toLocaleDateString()}
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
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>测试连接</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDefaultCluster(cluster.id, cluster.isDefault)}
                        >
                          {cluster.isDefault ? (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ) : (
                            <StarOff className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{cluster.isDefault ? "当前为默认集群" : "设默认集群"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteCluster(cluster)}
                        >
                          <Trash2 className="h-4 w-4" />
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
  )
} 