"use client"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Clock, Trash2 } from "lucide-react"
import { QueryHistoryItem } from "@/types/query"
import { eventBus, EVENTS } from "@/lib/events"

interface QueryHistoryProps {
  clusterId: string
  onItemClick: (item: QueryHistoryItem) => void
}

const MAX_HISTORY_ITEMS = 20

export function QueryHistory({ clusterId, onItemClick }: QueryHistoryProps) {
  const [history, setHistory] = useState<QueryHistoryItem[]>([])

  const loadHistory = () => {
    const key = `query-history-${clusterId}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        const parsedHistory = JSON.parse(saved)
        if (Array.isArray(parsedHistory)) {
          // 只保留最近的20条记录
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
    loadHistory()

    // 监听查询历史更新事件
    const handleHistoryUpdate = () => {
      loadHistory()
    }

    eventBus.on(`queryHistoryUpdated-${clusterId}`, handleHistoryUpdate)

    return () => {
      eventBus.off(`queryHistoryUpdated-${clusterId}`, handleHistoryUpdate)
    }
  }, [clusterId])

  const clearHistory = () => {
    const key = `query-history-${clusterId}`
    localStorage.removeItem(key)
    setHistory([])
  }

  // 格式化时间的辅助函数
  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">查询历史</h3>
          <span className="text-xs text-muted-foreground">
            (最近 {MAX_HISTORY_ITEMS} 条)
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearHistory}
          disabled={history.length === 0}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-2 p-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="rounded-md border p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onItemClick(item)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.method} {item.path}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(item.timestamp)}
                  </span>
                </div>
                <pre className="mt-2 text-xs text-muted-foreground line-clamp-2 overflow-hidden">
                  {item.query}
                </pre>
              </div>
            ))}
            {history.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  暂无查询历史
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
} 