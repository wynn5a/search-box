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
import { TemplateGeneratorButton } from "./template-generator-button"
import { useOpenSearchClient } from "@/hooks/use-opensearch-client"

interface QueryWorkspaceProps {
  clusterId: string
}

export function QueryWorkspace({ clusterId }: QueryWorkspaceProps) {
  const [selectedIndex, setSelectedIndex] = useState<string>("__placeholder__")
  const [queryBody, setQueryBody] = useState("")
  const [method, setMethod] = useState<string>("GET")
  const [path, setPath] = useState<string>("")
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
  const client = useOpenSearchClient(clusterId)

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
          description: e instanceof Error ? e.message : "请检查请求体的 JSON 格式是否正确",
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
                {selectedIndex !== "__placeholder__" && path.includes("/_doc") 
                && selectedIndex !== "*"
                && selectedIndex !== "_all"
                && (
                  <TemplateGeneratorButton
                    client={client}
                    index={selectedIndex}
                    onGenerated={setQueryBody}
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