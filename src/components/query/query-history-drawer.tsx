"use client"

import { useState, useEffect } from "react"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, Copy, Trash2 } from "lucide-react"
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Badge } from "@/components/ui/badge"
import { QueryHistoryItem } from "@/types/query"
import { eventBus, EVENTS } from "@/lib/events"

interface QueryHistoryDrawerProps {
  clusterId: string
  onSelect: (query: QueryHistoryItem) => void
}

const MAX_HISTORY_ITEMS = 50

export function QueryHistoryDrawer({ clusterId, onSelect }: QueryHistoryDrawerProps) {
  const [history, setHistory] = useState<QueryHistoryItem[]>([])
  const [open, setOpen] = useState(false)

  const loadHistory = () => {
    const key = `query-history-${clusterId}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        const parsedHistory = JSON.parse(saved)
        if (Array.isArray(parsedHistory)) {
          // 只保留最近的记录
          setHistory(parsedHistory.slice(0, MAX_HISTORY_ITEMS).filter(item => 
            item && 
            typeof item.id === 'string' &&
            typeof item.query === 'string' &&
            typeof item.timestamp === 'string' &&
            ['GET', 'POST', 'PUT', 'DELETE'].includes(item.method) &&
            typeof item.path === 'string'
          ))
        }
      } catch (e) {
        console.error('Failed to parse history:', e)
        setHistory([])
      }
    }
  }

  useEffect(() => {
    if (open) {
      loadHistory()
    }

    // 监听查询历史更新事件
    const handleHistoryUpdate = () => {
      loadHistory()
    }

    eventBus.on(`queryHistoryUpdated-${clusterId}`, handleHistoryUpdate)

    return () => {
      eventBus.off(`queryHistoryUpdated-${clusterId}`, handleHistoryUpdate)
    }
  }, [clusterId, open])

  const clearHistory = () => {
    const key = `query-history-${clusterId}`
    localStorage.removeItem(key)
    setHistory([])
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          查询历史
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[1000px] sm:w-[1200px] max-w-[90vw]">
        <SheetHeader>
          <SheetTitle>查询历史</SheetTitle>
          <SheetDescription>
            最近执行的 {MAX_HISTORY_ITEMS} 条查询记录
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 h-[calc(100vh-200px)] mt-4">
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                暂无查询历史
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-lg border p-4 space-y-2 hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{item.method}</Badge>
                      <span className="font-mono text-sm">{item.path}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onSelect(item)
                          setOpen(false)
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {item.query && (
                    <pre className="text-sm bg-muted p-2 rounded-md overflow-x-auto">
                      {item.query}
                    </pre>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.timestamp), { 
                      addSuffix: true,
                      locale: zhCN
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <SheetFooter className="mt-4">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={clearHistory}
              disabled={history.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              清空历史
            </Button>
            <SheetClose asChild>
              <Button variant="outline" size="sm">
                关闭
              </Button>
            </SheetClose>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
} 