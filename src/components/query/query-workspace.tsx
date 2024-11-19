"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Editor } from "@monaco-editor/react"
import { useIndices } from "@/hooks/use-indices"
import { useQueryExecution } from "@/hooks/use-query-execution"
import { IndexSelector } from "./index-selector"
import { EnhancedQueryResults } from "./enhanced-query-results"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Loader2 } from "lucide-react"
import { QueryTemplateManager} from "./query-template-manager"
import { type QueryTemplate } from "@/config/default-templates"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

interface QueryWorkspaceProps {
  clusterId: string
}


// 错误消息映射
const ERROR_MESSAGES: Record<string, string> = {
  // 索引相关
  'resource_already_exists_exception': '索引已存在，如果要重新创建，请先删除现有索引',
  'index_not_found_exception': '索引不存在，请检查索引名称是否正确',
  'invalid_index_name_exception': '索引名称无效，不能包含特殊字符',
  
  // 查询相关
  'parsing_exception': '查询语法错误，请检查查询语句格式',
  'search_phase_execution_exception': '搜索执行错误，可能是查询语句有误',
  'query_shard_exception': '查询分片出错，请检查查询条件',
  
  // 字段相关
  'mapper_parsing_exception': '字段映射解析错误，请检查字段定义',
  'illegal_argument_exception': '参数错误，请检查请求参数',
  
  // 集群相关
  'cluster_block_exception': '集群当前被阻止执行此操作',
  'no_shard_available_action_exception': '没有可用的分片，集群可能存在问题',
  
  // 通用错误
  'validation_exception': '验证失败，请检查请求内容',
  'action_request_validation_exception': '请求验证失败，请检查必填参数',
  
  // 权限相关
  'security_exception': '没有执行此操作的权限，请检查用户权限',
  'authorization_exception': '授权失败，请检查访问权限',
  
  // 其他常见错误
  'version_conflict_engine_exception': '版本冲突，数据可能已被其他操作修改',
  'document_missing_exception': '文档不存在',
  'circuit_breaking_exception': '内存使用超出限制，请优化查询'
}

// 提取错误类型
function extractErrorType(error: any): string {
  // 处理 OpenSearch ResponseError
  if (error?.details?.meta?.body?.error?.type) {
    return error.details.meta.body.error.type
  }

  // 处理标准错误对象
  if (error?.type) {
    return error.type
  }

  // 处理嵌套的错误对象
  if (error?.reason?.type) {
    return error.reason.type
  }

  // 处理错误消息中的类型
  if (error?.message) {
    const matches = error.message.match(/(?:exception|error):\s*([a-z_]+_exception)/i)
    return matches?.[1] || ''
  }

  return ''
}

// 获取错误的详细原因
function getErrorReason(error: any): string {
  if (typeof error === 'string') {
    return error
  }

  // 处理 OpenSearch ResponseError
  if (error?.meta?.body?.error?.reason) {
    return error.meta.body.error.reason
  }

  if (error?.reason) {
    return error.reason
  }

  if (error?.message) {
    return error.message
  }

  return ''
}

// 获取友好的错误消息

export function QueryWorkspace({ clusterId }: QueryWorkspaceProps) {
  const [selectedIndex, setSelectedIndex] = useState<string>("__placeholder__")
  const [queryBody, setQueryBody] = useState("")
  const [method, setMethod] = useState<string>("GET")
  const [path, setPath] = useState<string>("")
  const [viewMode, setViewMode] = useState<"table" | "json">("table")
  const [customTemplates, setCustomTemplates] = useState<QueryTemplate[]>([])
  const [editorHeight, setEditorHeight] = useState(200)
  const isDragging = useRef(false)
  const { toast } = useToast()
  const { theme } = useTheme()
  
  // 使用自定义 hooks
  const { indices, refresh } = useIndices(clusterId)
  const { loading: executing, results, executionTime, executeQuery, resetResults } = useQueryExecution(clusterId, {
    onSuccess: refresh
  })

  // 处理编辑器拖拽调整大小
  const handleMouseDown = () => {
    isDragging.current = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return
    const newHeight = Math.max(100, Math.min(600, editorHeight + e.movementY))
    setEditorHeight(newHeight)
  }, [editorHeight])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  // 加载自定义模板
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch(`/api/clusters/${clusterId}/templates`)
        if (!response.ok) throw new Error("Failed to fetch templates")
        const templates = await response.json()
        setCustomTemplates(templates)
      } catch (error) {
        console.error("Error fetching templates:", error)
        toast({
          title: "Error",
          description: "Failed to load custom templates",
          variant: "destructive",
        })
      }
    }

    fetchTemplates()
  }, [clusterId, toast])

  // 处理模板选择
  const handleTemplateSelect = (template: QueryTemplate) => {
    resetResults()
    setMethod(template.method)
    setPath(template.path)
    setQueryBody(template.body)
  }

  // 执行查询处理函数
  const handleExecute = async () => {
    // 检查路径中是否包含 {index} 并验证索引选择
    if (path.includes("{index}") && (selectedIndex === "__placeholder__" || !selectedIndex)) {
      toast({
        title: "需要选择索引",
        description: "请从下拉列表中选择一个索引",
        variant: "destructive",
      })
      return
    }

    try {
      // 解析请求体
      let parsedBody
      try {
        parsedBody = queryBody && queryBody.trim() !== '' ? JSON.parse(queryBody) : undefined
      } catch (e) {
        toast({
          title: "JSON 格式错误",
          description: "请检查请求体的 JSON 格式是否正确",
          variant: "destructive",
        })
        return
      }

      // 替换路径中的 {index} 占位符
      const processedPath = path.replace("{index}", selectedIndex)
      await executeQuery(method, processedPath, parsedBody)
    } catch (error) {
      console.error("Error executing query:", error)
    }
  }

  return (
    <div className="h-full">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={25} minSize={20}>
          <QueryTemplateManager
            customTemplates={customTemplates}
            currentQuery={
              path ? {
                method,
                path,
                body: queryBody,
              } : undefined
            }
            onSaveTemplate={async (template) => {
              try {
                const response = await fetch(`/api/clusters/${clusterId}/templates`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(template),
                })

                if (!response.ok) throw new Error("Failed to save template")
                const savedTemplate = await response.json()
                setCustomTemplates([...customTemplates, savedTemplate])
                toast({
                  title: "Template saved",
                  description: "Query template has been saved successfully",
                })
              } catch (error) {
                console.error("Error saving template:", error)
                toast({
                  title: "Error",
                  description: "Failed to save template",
                  variant: "destructive",
                })
              }
            }}
            onDeleteTemplate={async (templateId) => {
              try {
                const response = await fetch(
                  `/api/clusters/${clusterId}/templates/${templateId}`,
                  {
                    method: "DELETE",
                  }
                )

                if (!response.ok) throw new Error("Failed to delete template")
                setCustomTemplates(customTemplates.filter((t) => t.id !== templateId))
                toast({
                  title: "Template deleted",
                  description: "Query template has been deleted",
                })
              } catch (error) {
                console.error("Error deleting template:", error)
                toast({
                  title: "Error",
                  description: "Failed to delete template",
                  variant: "destructive",
                })
              }
            }}
            onSelectTemplate={handleTemplateSelect}
          />
        </ResizablePanel>
        
        <ResizableHandle />
        
        <ResizablePanel defaultSize={75}>
          <div className="h-full flex flex-col">
            <div className="flex-none p-4">
              <div className="flex items-center space-x-2">
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="Path (e.g., /_cat/indices)"
                  className="flex-1"
                />
                {path.includes("{index}") && (
                  <IndexSelector
                    indices={indices}
                    selectedIndex={selectedIndex}
                    onIndexChange={setSelectedIndex}
                  />
                )}
                <Button 
                  onClick={handleExecute}
                  disabled={executing || !path || (path.includes("{index}") && (selectedIndex === "__placeholder__" || !selectedIndex))}
                >
                  {executing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  <span className="ml-2">Execute</span>
                </Button>
              </div>
            </div>

            <div className="flex-none p-4">
              <div style={{ height: editorHeight }} className="relative border">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  value={queryBody}
                  onChange={(value) => setQueryBody(value || "")}
                  theme={theme === 'dark' ? 'vs-dark' : 'light'}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    tabSize: 2,
                  }}
                />
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 cursor-row-resize bg-border hover:bg-primary/50"
                  onMouseDown={handleMouseDown}
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 p-4">
              <div className="h-full border rounded-md">
                <EnhancedQueryResults
                  results={results}
                  executionTime={executionTime}
                />
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}