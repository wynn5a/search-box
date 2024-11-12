"use client"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Clock, Trash2 } from "lucide-react"
import { QueryHistoryItem } from "@/types/query"

interface QueryHistoryProps {
  clusterId: string
  onItemClick: (item: QueryHistoryItem) => void
}

export function QueryHistory({ clusterId, onItemClick }: QueryHistoryProps) {
  const [history, setHistory] = useState<QueryHistoryItem[]>([])

  useEffect(() => {
    // 从 localStorage 加载历史记录
    const loadHistory = () => {
      const key = `query-history-${clusterId}`
      const saved = localStorage.getItem(key)
      if (saved) {
        try {
          const parsedHistory = JSON.parse(saved)
          // 确保历史记录中的每个项目都符合类型定义
          if (Array.isArray(parsedHistory)) {
            setHistory(parsedHistory.filter(item => 
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
    loadHistory()
  }, [clusterId])

  const clearHistory = () => {
    const key = `query-history-${clusterId}`
    localStorage.removeItem(key)
    setHistory([])
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="font-semibold">查询历史</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearHistory}
          disabled={history.length === 0}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="rounded-md border p-3 hover:bg-muted/50 cursor-pointer"
              onClick={() => onItemClick(item)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.method} {item.path}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <pre className="mt-2 text-xs text-muted-foreground line-clamp-2">
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
  )
} 