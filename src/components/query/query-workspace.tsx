"use client"

import { useState, useCallback } from "react"
import { QueryEditor } from "./query-editor"
import { QueryHistory } from "./query-history"
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable"
import { HttpMethod, QueryHistoryItem } from "@/types/query"

interface StorageState {
  showHistory: boolean
  historySize: number
}

export function QueryWorkspace({ clusterId }: { clusterId: string }) {
  const [showHistory, setShowHistory] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`query-history-visible-${clusterId}`)
      return saved ? JSON.parse(saved) : true
    }
    return true
  })

  const [historySize, setHistorySize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`query-history-size-${clusterId}`)
      return saved ? JSON.parse(saved) : 20
    }
    return 20
  })

  const [selectedQuery, setSelectedQuery] = useState<QueryHistoryItem | null>(null)
  const [historyKey] = useState(`query-history-${clusterId}`)

  const handleHistoryItemClick = useCallback((item: QueryHistoryItem) => {
    if (isValidHttpMethod(item.method)) {
      setSelectedQuery({
        ...item,
        method: item.method
      })
    }
  }, [])

  const handleQueryExecuted = useCallback((query: QueryHistoryItem) => {
    const saved = localStorage.getItem(historyKey)
    const history = saved ? JSON.parse(saved) : []
    localStorage.setItem(historyKey, JSON.stringify([query, ...history].slice(0, 50)))
  }, [historyKey])

  const handleToggleHistory = useCallback(() => {
    setShowHistory((prev: boolean) => {
      const newValue = !prev
      localStorage.setItem(`query-history-visible-${clusterId}`, JSON.stringify(newValue))
      return newValue
    })
  }, [clusterId])

  const handlePanelResize = useCallback((sizes: number[]) => {
    if (sizes[0]) {
      const newSize = sizes[0]
      localStorage.setItem(`query-history-size-${clusterId}`, JSON.stringify(newSize))
      setHistorySize(newSize)
    }
  }, [clusterId])

  const isValidHttpMethod = (method: string): method is HttpMethod => {
    return ['GET', 'POST', 'PUT', 'DELETE'].includes(method)
  }

  return (
    <div className="h-full">
      <ResizablePanelGroup 
        direction="horizontal"
        onLayout={handlePanelResize}
      >
        {showHistory && (
          <>
            <ResizablePanel 
              defaultSize={historySize} 
              minSize={15} 
              maxSize={30}
            >
              <div className="h-full border-r">
                <QueryHistory 
                  clusterId={clusterId}
                  onItemClick={handleHistoryItemClick}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle className="w-2 bg-muted/10 hover:bg-muted/20 transition-colors" />
          </>
        )}
        <ResizablePanel defaultSize={showHistory ? 100 - historySize : 100}>
          <QueryEditor 
            clusterId={clusterId} 
            onToggleHistory={handleToggleHistory}
            onQueryExecuted={handleQueryExecuted}
            selectedQuery={selectedQuery}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
} 