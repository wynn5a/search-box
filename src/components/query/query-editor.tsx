"use client"

import { useState, useCallback, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable"
import { QueryToolbar } from "./query-toolbar"
import { RequestBuilder } from "./request-builder"
import { QueryBody } from "./query-body"
import { QueryResults } from "./query-results"
import { HttpMethod, OperationType, QueryHistoryItem, QueryResult, OPERATIONS } from "@/types/query"
import { eventBus } from "@/lib/events"

interface QueryEditorProps {
  clusterId: string
  onToggleHistory: () => void
  onQueryExecuted: (query: QueryHistoryItem) => void
  selectedQuery: QueryHistoryItem | null
}

export function QueryEditor({
  clusterId,
  onToggleHistory,
  onQueryExecuted,
  selectedQuery
}: QueryEditorProps): JSX.Element {
  const [query, setQuery] = useState('{\n  "query": {\n    "match_all": {}\n  }\n}')
  const [method, setMethod] = useState<HttpMethod>("POST")
  const [selectedOperation, setSelectedOperation] = useState<OperationType>('_search')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [viewMode, setViewMode] = useState<"json" | "table">("json")
  const [copied, setCopied] = useState(false)
  const [indices, setIndices] = useState<Array<{ index: string }>>([])
  const [selectedIndex, setSelectedIndex] = useState<string>("")
  const { toast } = useToast()

  // 自动切换到表格视图
  useEffect(() => {
    if (result?.hits?.hits && result.hits.hits.length > 0) {
      setViewMode('table')
    }
  }, [result])

  // 获取索引列表
  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const response = await fetch(`/api/clusters/${clusterId}/indices`)
        if (!response.ok) throw new Error("Failed to fetch indices")
        const data = await response.json()
        if (data.success) {
          setIndices(data.data)
        }
      } catch (error) {
        toast({
          title: "获取索引列表失败",
          description: "请稍后重试",
          variant: "destructive",
        })
      }
    }
    fetchIndices()
  }, [clusterId, toast])

  // 获取当前操作的配置
  const getCurrentOperation = useCallback(() => {
    return OPERATIONS.find(op => op.value === selectedOperation)
  }, [selectedOperation])

  // 获取当前操作允许的方法
  const getAllowedMethods = useCallback((): HttpMethod[] => {
    return getCurrentOperation()?.methods || ['GET']
  }, [getCurrentOperation])

  // 当操作改变时更新方法
  useEffect(() => {
    const operation = getCurrentOperation()
    if (operation && !operation.methods.includes(method)) {
      setMethod(operation.methods[0])
    }
  }, [selectedOperation, method, getCurrentOperation])

  // 处理历史记录选择
  useEffect(() => {
    if (selectedQuery) {
      setQuery(selectedQuery.query)
      setMethod(selectedQuery.method)

      // 从路径中提取索引和操作
      const pathParts = selectedQuery.path.split('/').filter(Boolean) // 移除空字符串
      
      // 重置当前选择的索引
      setSelectedIndex('')

      // 处理不同的路径格式
      if (pathParts[0] === '_cluster' || pathParts[0] === '_nodes') {
        // 集群级别的操作，不需要索引
        setSelectedOperation(pathParts.join('/') as OperationType)
      } else if (pathParts.length >= 2) {
        // 如果路径格式为 /{index}/{operation}
        const possibleIndex = pathParts[0]
        const operation = pathParts[1] as OperationType

        // 验证索引是否存在
        if (indices.some(i => i.index === possibleIndex)) {
          setSelectedIndex(possibleIndex)
        }

        // 验证操作是否有效
        if (OPERATIONS.some(op => op.value === operation)) {
          setSelectedOperation(operation)
        }
      } else if (pathParts.length === 1) {
        // 如果路径格式为 /{operation}
        const operation = pathParts[0] as OperationType
        if (OPERATIONS.some(op => op.value === operation)) {
          setSelectedOperation(operation)
        }
      }
    }
  }, [selectedQuery, indices])

  // 构建请求路径
  const getRequestPath = useCallback(() => {
    const operation = getCurrentOperation()
    if (!operation) return ''
    
    // 处理集群级别的操作
    if (operation.value.startsWith('_cluster/') || operation.value.startsWith('_nodes/')) {
      return `/${operation.value}`
    }
    
    // 处理需要索引的操作
    if (operation.requiresIndex && !selectedIndex) {
      return ''
    }

    // 对于文档插入操作，使用 _doc 端点
    if (operation.value === '_doc') {
      return `/${selectedIndex}/_doc`
    }

    return operation.requiresIndex 
      ? `/${selectedIndex}/${operation.value}`
      : `/${operation.value}`
  }, [selectedIndex, getCurrentOperation])

  // 当操作或索引改变时，自动生成请求体
  useEffect(() => {
    const generateTemplate = async () => {
      // 如果是 GET 请求，清空请求体
      if (method === 'GET') {
        setQuery('')
        return
      }

      if (selectedOperation === '_doc' && selectedIndex) {
        try {
          const response = await fetch(`/api/clusters/${clusterId}/indices/${selectedIndex}/template`)
          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              setQuery(JSON.stringify(data.data, null, 2))
            } else {
              toast({
                title: "生成模板失败",
                description: data.error || "请稍后重试",
                variant: "destructive",
              })
            }
          }
        } catch (error) {
          console.error('Failed to generate template:', error)
          toast({
            title: "生成模板失败",
            description: "请稍后重试",
            variant: "destructive",
          })
        }
      } else if (selectedOperation === '_search') {
        setQuery('{\n  "query": {\n    "match_all": {}\n  }\n}')
      }
    }

    generateTemplate()
  }, [selectedOperation, selectedIndex, clusterId, method, toast])

  const executeQuery = async () => {
    const operation = getCurrentOperation()
    if (!operation) return

    if (operation.requiresIndex && !selectedIndex) {
      toast({
        title: "请选择索引",
        description: "当前操作需要选择一个索引",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/clusters/${clusterId}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method,
          path: getRequestPath(),
          query,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Query failed")
      }

      const data = await response.json()
      console.log('Query result:', data)

      if (data.success) {
        setResult(data.data)

        // 保存到历史记录并通知父组件
        const historyItem = {
          id: Date.now().toString(),
          query,
          method,
          path: getRequestPath(),
          timestamp: new Date().toISOString(),
        }
        onQueryExecuted(historyItem)

        // 触发历史记录更新事件
        eventBus.emit(`queryHistoryUpdated-${clusterId}`)
      } else {
        throw new Error(data.error || "Query failed")
      }

    } catch (error) {
      toast({
        title: "查询失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "复制失败",
        description: "无法访问剪贴板",
        variant: "destructive",
      })
    }
  }

  const handleDownload = () => {
    if (!result) return
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `query-result-${new Date().toISOString()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-full flex-col">
      <QueryToolbar
        onToggleHistory={onToggleHistory}
        onExecuteQuery={executeQuery}
        loading={loading}
      />

      <div className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
        <RequestBuilder
          method={method}
          selectedOperation={selectedOperation}
          selectedIndex={selectedIndex}
          indices={indices}
          onMethodChange={setMethod}
          onOperationChange={setSelectedOperation}
          onIndexChange={setSelectedIndex}
          allowedMethods={getAllowedMethods()}
          requestPath={getRequestPath()}
        />

        <div className="flex-1 min-h-0">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={30} minSize={30} maxSize={70}>
              <QueryBody
                value={query}
                onChange={setQuery}
                readOnly={method === 'GET'}
              />
            </ResizablePanel>

            <ResizableHandle className="w-2 bg-muted/10 hover:bg-muted/20 transition-colors" />

            <ResizablePanel defaultSize={70} minSize={30} maxSize={70}>
              <QueryResults
                result={result}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onCopy={handleCopy}
                onDownload={handleDownload}
                onClear={() => setResult(null)}
                copied={copied}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  )
} 