"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Editor } from "@monaco-editor/react"
import { Copy, Download, Trash2 } from "lucide-react"
import { useTheme } from "next-themes"

interface QueryResultsProps {
  result: any
  viewMode: "table" | "json"
  onViewModeChange: (value: "table" | "json") => void
  onCopy?: () => Promise<void>
  onDownload?: () => void
  onClear?: () => void
  copied?: boolean
}

export function QueryResults({ 
  result, 
  viewMode,
  onViewModeChange,
  onCopy,
  onDownload,
  onClear,
  copied = false,
}: QueryResultsProps) {
  const [columns, setColumns] = useState<string[]>([])
  const [rows, setRows] = useState<any[]>([])
  const { theme } = useTheme()

  useEffect(() => {
    if (!result) return

    // 尝试将结果转换为表格数据
    try {
      let data = result
      // 如果是 _cat API 的结果，已经是数组形式
      if (Array.isArray(result)) {
        data = result
      }
      // 如果是搜索结果，提取 hits
      else if (result?.hits?.hits) {
        data = result.hits.hits.map((hit: any) => ({
          _id: hit._id,
          _score: hit._score,
          ...hit._source
        }))
      }
      // 如果是单个文档，包装成数组
      else if (typeof result === 'object') {
        data = [result]
      }

      if (Array.isArray(data) && data.length > 0) {
        // 从第一行提取列名
        const allColumns = new Set<string>()
        data.forEach(row => {
          Object.keys(row).forEach(key => allColumns.add(key))
        })
        setColumns(Array.from(allColumns))
        setRows(data)
      }
    } catch (error) {
      console.error('Failed to convert results to table:', error)
      setColumns([])
      setRows([])
    }
  }, [result])

  if (!result) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        在上方输入查询并点击执行
      </div>
    )
  }

  const renderValue = (value: any) => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <Tabs value={viewMode} onValueChange={(value) => {
          if (value === 'table' || value === 'json') {
            onViewModeChange(value)
          }
        }}>
          <TabsList>
            <TabsTrigger value="table">表格视图</TabsTrigger>
            <TabsTrigger value="json">JSON 视图</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          {onCopy && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCopy}
              disabled={copied}
            >
              <Copy className="h-4 w-4 mr-2" />
              {copied ? "已复制" : "复制"}
            </Button>
          )}
          {onDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              下载
            </Button>
          )}
          {onClear && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              清除
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {viewMode === "table" ? (
          rows.length > 0 ? (
            <ScrollArea className="overflow-hidden h-full border rounded-md">
              <div className="h-full overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead key={column}>{column}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow key={i}>
                        {columns.map((column) => (
                          <TableCell key={column}>
                            {renderValue(row[column])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              无法将结果转换为表格形式
            </div>
          )
        ) : (
          <ScrollArea className="h-full overflow-hidden border rounded-md">
            <div className="min-h-[200px] overflow-auto p-4">
              <Editor
                height="200px"
                defaultLanguage="json"
                value={JSON.stringify(result, null, 2)}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  tabSize: 2,
                }}
              />
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
} 