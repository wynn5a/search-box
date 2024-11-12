"use client"

import { Button } from "@/components/ui/button"
import { History, Loader2, Play } from "lucide-react"

interface QueryToolbarProps {
  onToggleHistory: () => void
  onExecuteQuery: () => void
  loading: boolean
}

export function QueryToolbar({
  onToggleHistory,
  onExecuteQuery,
  loading
}: QueryToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleHistory}
        >
          <History className="h-4 w-4" />
        </Button>
      </div>
      <Button
        onClick={onExecuteQuery}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            执行中...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            执行查询
          </>
        )}
      </Button>
    </div>
  )
} 