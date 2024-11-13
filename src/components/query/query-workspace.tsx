"use client"

import { useState, useCallback } from "react"
import { QueryEditor } from "./query-editor"
import { QueryHistory } from "./query-history"
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable"
import { QueryHistoryItem } from "@/types/query"

export function QueryWorkspace({ clusterId }: { clusterId: string }) {
  const [showHistory, setShowHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(`query-history-visible-${clusterId}`)
      return saved ? JSON.parse(saved) : true
    } catch {
      return true
    }
  })

  const [historySize, setHistorySize] = useState(() => {
    try {
      const saved = localStorage.getItem(`query-history-size-${clusterId}`)
      return saved ? JSON.parse(saved) : 20
    } catch {
      return 20
    }
  })

  const [selectedQuery, setSelectedQuery] = useState<QueryHistoryItem | null>(null)

  const handleHistoryItemClick = useCallback((item: QueryHistoryItem) => {
    setSelectedQuery(item)
  }, [])

  const handleQueryExecuted = useCallback((query: QueryHistoryItem) => {
    try {
      const key = `query-history-${clusterId}`
      const saved = localStorage.getItem(key)
      const history = saved ? JSON.parse(saved) : []
      localStorage.setItem(key, JSON.stringify([query, ...history].slice(0, 50)))
    } catch (error) {
      console.error('Failed to save query history:', error)
    }
  }, [clusterId])

  const handleToggleHistory = useCallback(() => {
    setShowHistory((prev: boolean) => {
      const newValue = !prev
      try {
        localStorage.setItem(`query-history-visible-${clusterId}`, JSON.stringify(newValue))
      } catch (error) {
        console.error('Failed to save history visibility:', error)
      }
      return newValue
    })
  }, [clusterId])

  const handlePanelResize = useCallback((sizes: number[]) => {
    if (sizes[0]) {
      const newSize = sizes[0]
      try {
        localStorage.setItem(`query-history-size-${clusterId}`, JSON.stringify(newSize))
      } catch (error) {
        console.error('Failed to save history size:', error)
      }
      setHistorySize(newSize)
    }
  }, [clusterId])

  return (
    <div className="h-full overflow-hidden">
      <ResizablePanelGroup 
        direction="horizontal"
        onLayout={handlePanelResize}
        className="h-full"
      >
        {showHistory && (
          <>
            <ResizablePanel 
              defaultSize={historySize} 
              minSize={15} 
              maxSize={30}
              className="h-full"
            >
              <div className="h-full">
                <QueryHistory 
                  clusterId={clusterId}
                  onItemClick={handleHistoryItemClick}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle className="w-2 bg-muted/10 hover:bg-muted/20 transition-colors" />
          </>
        )}
        <ResizablePanel 
          defaultSize={showHistory ? 100 - historySize : 100}
          className="h-full"
        >
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