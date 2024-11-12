"use client"

import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileJson, TableIcon, Copy, Check, Download, Trash } from "lucide-react"
import { QueryResult } from "@/types/query"

interface QueryResultsProps {
  result: QueryResult | null
  viewMode: "json" | "table"
  onViewModeChange: (mode: "json" | "table") => void
  onCopy: () => void
  onDownload: () => void
  onClear: () => void
  copied: boolean
}

export function QueryResults({
  result,
  viewMode,
  onViewModeChange,
  onCopy,
  onDownload,
  onClear,
  copied,
}: QueryResultsProps) {
  // 格式化表格中的值
  const formatValue = (value: any): string => {
    if (value == null) return '-'
    if (typeof value === 'object') return JSON.stringify(value)
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'boolean') return value ? '是' : '否'
    return String(value)
  }

  // 获取嵌套对象的值
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">执行查询以查看结果</p>
      </div>
    )
  }

  return (
    <Card className="flex flex-col h-full min-h-0">
      <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as "json" | "table")} className="flex-1 flex flex-col">
        <div className="border-b px-4 flex-shrink-0 flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="json" className="gap-2">
              <FileJson className="h-4 w-4" />
              JSON
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2">
              <TableIcon className="h-4 w-4" />
              表格
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            {result.took !== undefined && (
              <span className="text-sm text-muted-foreground">
                耗时: {result.took}ms
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onCopy}
            >
              {copied ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copied ? '已复制' : '复制'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownload}
            >
              <Download className="mr-2 h-4 w-4" />
              下载
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
            >
              <Trash className="mr-2 h-4 w-4" />
              清除
            </Button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          <TabsContent value={viewMode} className="h-full m-0 p-0">
            {renderResults()}
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  )

  function renderResults() {
    if (viewMode === 'json') {
      return (
        <ScrollArea className="h-full w-full">
          <div className="p-4">
            <pre className="whitespace-pre-wrap break-words">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </ScrollArea>
      )
    }

    if (!result?.hits?.hits?.length) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">无匹配结果</p>
        </div>
      )
    }

    const hits = result.hits.hits
    const getFields = (obj: any, prefix = ''): string[] => {
      return Object.entries(obj).flatMap(([key, value]) => {
        const currentPath = prefix ? `${prefix}.${key}` : key
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          return getFields(value, currentPath)
        }
        return [currentPath]
      })
    }

    const columns = Array.from(
      new Set(hits.flatMap(hit => getFields(hit._source)))
    ).sort()

    return (
      <ScrollArea className="h-full w-full">
        <div className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">文档ID</TableHead>
                <TableHead className="w-[80px]">得分</TableHead>
                {columns.map((column) => (
                  <TableHead key={column}>{column}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {hits.map((hit) => (
                <TableRow key={hit._id}>
                  <TableCell className="font-medium">{hit._id}</TableCell>
                  <TableCell>{hit._score?.toFixed(2) || '-'}</TableCell>
                  {columns.map((column) => (
                    <TableCell key={column}>
                      {formatValue(getNestedValue(hit._source, column))}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    )
  }
} 