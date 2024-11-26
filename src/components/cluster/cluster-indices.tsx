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
import { Search, RefreshCw, Cog, ListFilter, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTranslations } from "next-intl"
import { ScrollArea } from "../ui/scroll-area"

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
  const t = useTranslations()
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
        title: t("cluster.indices.error.load_failed.title"),
        description: t("cluster.indices.error.load_failed.description"),
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

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="relative w-[300px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("cluster.indices.search.placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Tabs defaultValue="user" value={indexType} onValueChange={(value) => setIndexType(value as IndexType)}>
            <TabsList>
              <TabsTrigger value="all">
                <ListFilter className="h-4 w-4 mr-2" />
                {t("cluster.indices.type.all")}
              </TabsTrigger>
              <TabsTrigger value="user">
                <User className="h-4 w-4 mr-2" />
                {t("cluster.indices.type.user")}
              </TabsTrigger>
              <TabsTrigger value="system">
                <Cog className="h-4 w-4 mr-2" />
                {t("cluster.indices.type.system")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchIndices}
          disabled={refreshing}
        >
          <RefreshCw className={cn(
            "h-4 w-4 mr-2",
            refreshing && "animate-spin"
          )} />
          {t("common.button.refresh")}
        </Button>
      </div>

      <div className="flex-1 min-h-0 border rounded overflow-auto">
        <ScrollArea className="h-[350px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] text-center sticky top-0 bg-background">
                  {t("cluster.indices.table.health")}
                </TableHead>
                <TableHead className="sticky top-0 bg-background">
                  {t("cluster.indices.table.name")}
                </TableHead>
                <TableHead className="text-right sticky top-0 bg-background">
                  {t("cluster.indices.table.docs")}
                </TableHead>
                <TableHead className="text-right sticky top-0 bg-background">
                  {t("cluster.indices.table.size")}
                </TableHead>
                <TableHead className="text-right sticky top-0 bg-background">
                  {t("cluster.indices.table.status")}
                </TableHead>
                <TableHead className="text-right sticky top-0 bg-background">
                  {t("cluster.indices.table.shards")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <LoadingSkeleton />
              ) : filteredIndices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {t("cluster.indices.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredIndices.map((index) => (
                  <TableRow
                    key={index.uuid}
                    className="cursor-pointer"
                    onClick={() => router.push(`/clusters/${clusterId}/indices/${index.index}`)}
                  >
                    <TableCell className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className={cn(
                              "h-2 w-2 rounded-full mx-auto",
                              getHealthColor(index.health)
                            )} />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="capitalize">{t(`common.status.${index.health}`)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{index.index}</div>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(index["docs.count"])}</TableCell>
                    <TableCell className="text-right">{index["store.size"]}</TableCell>
                    <TableCell className="text-right capitalize">{index.status}</TableCell>
                    <TableCell className="text-right">{index.pri}/{index.rep}</TableCell>
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