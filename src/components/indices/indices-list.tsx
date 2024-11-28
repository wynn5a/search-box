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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Play, Pause, Lock, RefreshCw } from "lucide-react"
import { CreateIndexDialog } from "./create-index-dialog"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"

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

const DeleteButton = ({
  index,
  onDelete
}: {
  index: string,
  onDelete: () => Promise<void>
}) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    await onDelete()
    setIsDeleting(false)
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确定要删除这个索引吗？</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            你即将删除索引 <span className="font-medium text-foreground">{index}</span>
            <br />
            此操作不可恢复，索引中的所有数据都将永久删除。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                删除中...
              </>
            ) : (
              "确认删除"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function IndicesList({ clusterId }: { clusterId: string }) {
  const router = useRouter()
  const [indices, setIndices] = useState<IndexStats[]>([])
  const [loading, setLoading] = useState(true)
  const [showHiddenIndices, setShowHiddenIndices] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchIndices = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/clusters/${clusterId}/indices`)
      if (!response.ok) throw new Error("Failed to fetch indices")
      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        setIndices(data.data)
      } else {
        setIndices([])
      }
    } catch (error) {
      toast({
        title: "获取索引列表失败",
        description: "请稍后重试",
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

  const deleteIndex = async (indexName: string) => {
    try {
      const response = await fetch(`/api/clusters/${clusterId}/indices/${indexName}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete index")

      toast({
        title: "索引已删除",
        description: `索引 "${indexName}" 已成功删除`,
      })
      fetchIndices()
    } catch (error) {
      toast({
        title: "删除索引失败",
        description: "请稍后重试",
        variant: "destructive",
      })
    }
  }

  const toggleIndex = async (indexName: string, isOpen: boolean) => {
    try {
      const response = await fetch(
        `/api/clusters/${clusterId}/indices/${indexName}/${isOpen ? "close" : "open"}`,
        { method: "POST" }
      )
      if (!response.ok) throw new Error(`Failed to ${isOpen ? "close" : "open"} index`)

      toast({
        title: `索引已${isOpen ? "关闭" : "打开"}`,
        description: `索引 "${indexName}" 已${isOpen ? "关闭" : "打开"}`,
      })
      fetchIndices()
    } catch (error) {
      toast({
        title: `${isOpen ? "关闭" : "打开"}索引失败`,
        description: "请稍后重试",
        variant: "destructive",
      })
    }
  }

  const filteredIndices = indices.filter(index => {
    if (!index || typeof index.index !== 'string') return false
    return showHiddenIndices ? true : !index.index.startsWith('.')
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">索引列表</h2>
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>状态</TableHead>
                <TableHead>索引名称</TableHead>
                <TableHead className="text-center">主分片</TableHead>
                <TableHead className="text-center">副本分片</TableHead>
                <TableHead className="text-center">文档数</TableHead>
                <TableHead className="text-center">已删除</TableHead>
                <TableHead className="text-center">存储大小</TableHead>
                <TableHead className="text-center">主分片大小</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="show-hidden"
            checked={showHiddenIndices}
            onCheckedChange={setShowHiddenIndices}
          />
          <Label htmlFor="show-hidden">显示系统索引</Label>
        </div>
        <div className="flex space-x-2">
          <CreateIndexDialog clusterId={clusterId} onCreated={fetchIndices} />
          <Button
            variant="outline"
            size="icon"
            onClick={fetchIndices}
            disabled={refreshing}
          >
            <RefreshCw className={cn(
              "h-4 w-4",
              refreshing && "animate-spin"
            )} />
          </Button>
        </div>

      </div>

      <ScrollArea className="h-[500px] rounded-md border">
        <Table className="text-center">
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">状态</TableHead>
              <TableHead>索引名称</TableHead>
              <TableHead className="text-center">主分片</TableHead>
              <TableHead className="text-center">副本分片</TableHead>
              <TableHead className="text-center">文档数</TableHead>
              <TableHead className="text-center">已删除</TableHead>
              <TableHead className="text-center">存储大小</TableHead>
              <TableHead className="text-center">主分片大小</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIndices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  没有找到索引
                </TableCell>
              </TableRow>
            ) : (
              filteredIndices.map((index) => (
                <TableRow
                  key={index.index}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={(e) => {
                    // 如果点击的是按钮区域，不进行导航
                    if ((e.target as HTMLElement).closest('button, [role="button"]')) {
                      return
                    }
                    if(index.index.indexOf('.') !== -1) {
                      return
                    }
                    router.push(`/clusters/${clusterId}/indices/${index.index}`)
                  }}
                >
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div
                            className={cn(
                              "h-3 w-3 rounded-full",
                              getHealthColor(index.health)
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{index.health}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      {index.index.startsWith('.') && (
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span>{index.index}</span>
                      {index.status === 'close' && (
                        <Badge variant="secondary">已关闭</Badge>
                      )}
                      {index.status === 'open' && (
                        <Badge variant="secondary">已开启</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{index.pri}</TableCell>
                  <TableCell>{index.rep}</TableCell>
                  <TableCell>
                    {typeof index["docs.count"] === "number"
                      ? index["docs.count"].toLocaleString()
                      : "0"
                    }
                  </TableCell>
                  <TableCell>
                    {typeof index["docs.deleted"] === "number"
                      ? index["docs.deleted"].toLocaleString()
                      : "0"
                    }
                  </TableCell>
                  <TableCell>{index["store.size"] || "0b"}</TableCell>
                  <TableCell>{index["pri.store.size"] || "0b"}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleIndex(index.index, index.status === 'open')}
                      >
                        {index.status === 'open' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <DeleteButton
                        index={index.index}
                        onDelete={() => deleteIndex(index.index)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}