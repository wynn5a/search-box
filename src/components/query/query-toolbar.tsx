"use client"

import { Button } from "@/components/ui/button"
import { History, Loader2, Play, FileText, Files } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface QueryToolbarProps {
  onToggleHistory: () => void
  onExecuteQuery: () => void
  onGenerateTemplate?: () => void
  onGenerateBulkTemplate?: () => void
  loading: boolean
}

export function QueryToolbar({
  onToggleHistory,
  onExecuteQuery,
  onGenerateTemplate,
  onGenerateBulkTemplate,
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
        <TooltipProvider>
          {onGenerateTemplate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onGenerateTemplate}
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>根据索引映射生成文档模板</p>
              </TooltipContent>
            </Tooltip>
          )}
          {onGenerateBulkTemplate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onGenerateBulkTemplate}
                >
                  <Files className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>生成批量插入文档模板</p>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
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