"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, RefreshCw, Database, Cog, ListFilter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { ScrollArea } from "../ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "../ui/badge"

interface IndexInfo {
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

type IndexType = 'user' | 'system' | 'all'

interface ClusterIndicesProps {
  clusterId: string
}

export function ClusterIndices({ clusterId }: ClusterIndicesProps) {
  const [indices, setIndices] = useState<IndexInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [indexType, setIndexType] = useState<IndexType>('user')
  const { toast } = useToast()
  const router = useRouter()

  const fetchIndices = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/clusters/${clusterId}/indices`)
      if (!response.ok) throw new Error("Failed to fetch indices")
      const data = await response.json()
      setIndices(data.data || [])
    } catch (error) {
      console.error(error)
      toast({
        title: "获取索引列表失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      })
      setIndices([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchIndices()
  }, [clusterId])

  const isSystemIndex = (indexName: string) => {
    return indexName.startsWith('.') || // 以点开头的索引
           indexName.startsWith('_') || // 以下划线开头的索引
           ['security', 'kibana', 'logstash'].some(prefix => 
             indexName.startsWith(prefix + '_') || indexName.startsWith(prefix + '-')
           )
  }

  const filteredIndices = indices.filter(index => {
    const matchesSearch = index.index.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = indexType === 'all' ? true : 
                       indexType === 'system' ? isSystemIndex(index.index) :
                       !isSystemIndex(index.index)
    return matchesSearch && matchesType
  })

  const getHealthColor = (health: string) => {
    switch (health.toLowerCase()) {
      case "green":
        return "bg-green-500"
      case "yellow":
        return "bg-yellow-500"
      case "red":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 w-full max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索索引..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Tabs value={indexType} onValueChange={(value) => setIndexType(value as IndexType)}>
            <TabsList>
              <TabsTrigger value="user">
                <Database className="h-4 w-4 mr-2" />
                用户索引
              </TabsTrigger>
              <TabsTrigger value="system">
                <Cog className="h-4 w-4 mr-2" />
                系统索引
              </TabsTrigger>
              <TabsTrigger value="all">
                <ListFilter className="h-4 w-4 mr-2" />
                全部
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchIndices}
                  disabled={refreshing}
                >
                  <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>刷新索引列表</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => router.push(`/clusters/${clusterId}/indices`)}
                >
                  <Cog className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>索引管理</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="rounded-lg border">
        <ScrollArea className="h-[calc(100vh-450px)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">状态</TableHead>
              <TableHead className="text-left">索引名称</TableHead>
              <TableHead className="text-right">主分片</TableHead>
              <TableHead className="text-right">副本分片</TableHead>
              <TableHead className="text-right">文档数</TableHead>
              <TableHead className="text-right">已删除</TableHead>
              <TableHead className="text-right">存储大小</TableHead>
              <TableHead className="text-right">主分片大小</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIndices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  没有找到匹配的索引
                </TableCell>
              </TableRow>
            ) : (
              filteredIndices.map((index) => (
                <TableRow 
                  key={index.index}
                  className="hover:bg-muted/50"
                >
                  <TableCell className="text-center items-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        getHealthColor(index.health)
                      )} />
                      <Badge variant="secondary" className="capitalize">{index.status.toLowerCase()}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{index.index}</div>
                    <div className="text-xs text-muted-foreground">{index.uuid}</div>
                  </TableCell>
                  <TableCell className="text-right">{index.pri}</TableCell>
                  <TableCell className="text-right">{index.rep}</TableCell>
                  <TableCell className="text-right">{index["docs.count"].toLocaleString()}</TableCell>
                  <TableCell className="text-right">{index["docs.deleted"].toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">{index["store.size"]}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{index["pri.store.size"]}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </ScrollArea>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-[200px]" />
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
      </div>
      <div className="border rounded-lg">
        <div className="space-y-2 p-4">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
} 