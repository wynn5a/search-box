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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Play, Pause, Lock } from "lucide-react"
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
import { IndexSettingsDialog } from "./index-settings-dialog"

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
  const [indices, setIndices] = useState<IndexStats[]>([])
  const [loading, setLoading] = useState(true)
  const [showHiddenIndices, setShowHiddenIndices] = useState(false)
  const { toast } = useToast()

  const fetchIndices = async () => {
    try {
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
    }
  }

  useEffect(() => {
    fetchIndices()
    const interval = setInterval(fetchIndices, 30000)
    return () => clearInterval(interval)
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
    return <div>加载索引列表中...</div>
  }

  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "0"
    return value.toLocaleString()
  }

  const formatSize = (size: string | null | undefined) => {
    if (size === null || size === undefined) return "0b"
    return size
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Switch
            id="show-hidden"
            checked={showHiddenIndices}
            onCheckedChange={setShowHiddenIndices}
          />
          <Label htmlFor="show-hidden">显示系统索引</Label>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>系统索引</span>
          </div>
        </div>
        <CreateIndexDialog clusterId={clusterId} onSuccess={fetchIndices} />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">状态</TableHead>
              <TableHead>索引名称</TableHead>
              <TableHead>文档数</TableHead>
              <TableHead>主分片</TableHead>
              <TableHead>副本分片</TableHead>
              <TableHead>存储大小</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIndices.map((index) => (
              <TableRow 
                key={index.index}
                className={cn(
                  index.index.startsWith('.') && "bg-muted/50"
                )}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${getHealthColor(index.health)}`}
                    />
                    <Badge
                      variant={index.status === "open" ? "default" : "secondary"}
                    >
                      {index.status}
                    </Badge>
                    {index.index.startsWith('.') && (
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>{index.index}</span>
                  </div>
                </TableCell>
                <TableCell>{formatNumber(index["docs.count"])}</TableCell>
                <TableCell>{formatNumber(index.pri)}</TableCell>
                <TableCell>{formatNumber(index.rep)}</TableCell>
                <TableCell>{formatSize(index["store.size"])}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleIndex(index.index, index.status === "open")}
                          >
                            {index.status === "open" ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{index.status === "open" ? "关闭索引" : "打开索引"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <IndexSettingsDialog
                            clusterId={clusterId}
                            indexName={index.index}
                            onSuccess={fetchIndices}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>索引设置</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DeleteButton 
                            index={index.index} 
                            onDelete={() => deleteIndex(index.index)} 
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>删除索引</p>
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
    </div>
  )
} 