"use client"

import React, { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { ChevronRight, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger,
  TooltipProvider 
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"

interface JsonViewerProps {
  data: any
  name?: string
  isRoot?: boolean
  expanded?: boolean
  className?: string
  onCopy?: (path: string, value: any) => void
}

function getValueType(value: any): string {
  if (value === null) return "null"
  if (Array.isArray(value)) return "array"
  return typeof value
}

function getTypeColor(type: string): string {
  switch (type) {
    case "string":
      return "text-green-500 dark:text-green-400"
    case "number":
      return "text-blue-500 dark:text-blue-400"
    case "boolean":
      return "text-purple-500 dark:text-purple-400"
    case "null":
      return "text-gray-500 dark:text-gray-400"
    default:
      return "text-foreground"
  }
}

function getCollapsedPreview(value: any): string {
  const type = getValueType(value)
  if (type === "array") {
    return `Array(${value.length})`
  }
  if (type === "object") {
    return `{...}`
  }
  if (type === "string") {
    return value.length > 20 ? `"${value.slice(0, 20)}..."` : `"${value}"`
  }
  return String(value)
}

export function JsonViewer({
  data,
  name,
  isRoot = false,
  expanded = false,
  className,
  onCopy,
}: JsonViewerProps) {
  const [isExpanded, setIsExpanded] = useState(expanded)
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    onCopy?.(name || "", data)
    setCopied(true)
    toast({
      description: "已复制到剪贴板",
      duration: 2000,
    })
    setTimeout(() => setCopied(false), 1000)
  }, [data, name, onCopy, toast])

  const type = getValueType(data)
  const isExpandable = type === "object" || type === "array"
  const hasChildren = isExpandable && Object.keys(data).length > 0

  const renderValue = () => {
    if (!isExpandable) {
      return (
        <span className={cn("font-mono", getTypeColor(type))}>
          {type === "string" ? `"${data}"` : String(data)}
        </span>
      )
    }

    if (!isExpanded) {
      return (
        <span className="text-muted-foreground font-mono">
          {getCollapsedPreview(data)}
        </span>
      )
    }

    return (
      <div className="space-y-1 mt-1">
        {Object.entries(data).map(([key, value]) => (
          <JsonViewer
            key={key}
            name={key}
            data={value}
            expanded={false}
            onCopy={onCopy}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={cn("font-mono text-sm", className)}>
      <div
        className={cn(
          "flex items-start gap-1 hover:bg-muted/30 rounded px-1",
          isRoot && "hover:bg-transparent"
        )}
      >
        <div className="flex items-center gap-1">
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <ChevronRight
                className={cn(
                  "h-3 w-3 transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            </Button>
          )}
          {name && (
            <>
              <span className="text-muted-foreground">{name}</span>
              <span className="text-muted-foreground/50">:</span>
              {hasChildren && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>复制此值</TooltipContent>
                </Tooltip>
              )}
            </>
          )}
        </div>
        <div className="flex-1">
          {renderValue()}
        </div>
      </div>
    </div>
  )
}

export function JsonViewerContainer({
  data,
  className,
}: {
  data: any
  className?: string
}) {
  const handleCopy = (path: string, value: any) => {
    const stringValue =
      typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)
    navigator.clipboard.writeText(stringValue)
  }

  return (
    <TooltipProvider>
      <ScrollArea className={cn("rounded-md border bg-card", className)}>
        <div className="p-4">
          <JsonViewer data={data} isRoot expanded onCopy={handleCopy} />
        </div>
      </ScrollArea>
    </TooltipProvider>
  )
}
