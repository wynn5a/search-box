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

  // 获取所有字段，包括嵌套字段
  const getFields = (obj: any, prefix = ''): string[] => {
    return Object.entries(obj).flatMap(([key, value]) => {
      const currentPath = prefix ? `${prefix}.${key}` : key
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return getFields(value, currentPath)
      }
      return [currentPath]
    })
  }

  // 渲染表格内容
  const renderTable = () => {
    // 如果是搜索结果
    if (result?.hits?.hits) {
      const hits = result.hits.hits
      if (hits.length === 0) {
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">无匹配结果</p>
          </div>
        )
      }

      const firstHit = hits[0]
      if (!firstHit._source) {
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">文档内容为空</p>
          </div>
        )
      }

      const fields = getFields(firstHit._source)

      return (
        <ScrollArea className="h-full">
          <div className="p-4">
            <div className="mb-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>总命中: {result.hits.total?.value || 0}</span>
                <span>显示: {hits.length} 条</span>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">文档ID</TableHead>
                  <TableHead className="w-[80px]">得分</TableHead>
                  {fields.map((field) => (
                    <TableHead key={field}>{field}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {hits.map((hit) => (
                  <TableRow key={hit._id}>
                    <TableCell className="font-medium">{hit._id}</TableCell>
                    <TableCell>{hit._score?.toFixed(2) || '-'}</TableCell>
                    {fields.map((field) => (
                      <TableCell key={field}>
                        {formatValue(getNestedValue(hit._source, field))}
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

    // 如果是插入/更新文档的结果
    if (result?._id) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-green-500 font-medium mb-2">操作成功</p>
            <p className="text-sm text-muted-foreground">文档 ID: {result._id}</p>
            {result.result && (
              <p className="text-sm text-muted-foreground mt-1">
                结果: {result.result}
              </p>
            )}
          </div>
        </div>
      )
    }

    // 其他类型的结果
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">请切换到 JSON 视图查看完整结果</p>
      </div>
    )
  }

  if (!result) {
    return (
      <Card className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">执行查询以查看结果</p>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-full">
      <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as "json" | "table")} className="flex flex-col h-full">
        <div className="border-b px-4 flex items-center justify-between">
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
        <div className="flex-1 overflow-hidden">
          <TabsContent value="json" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="table" className="h-full m-0">
            {renderTable()}
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  )
} 