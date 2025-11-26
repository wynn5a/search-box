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
import { QueryTemplateManager } from "./query-template-manager"
import { type QueryTemplate } from "@/config/default-templates"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { TemplateGeneratorButton } from "./template-generator-button"
import { useOpenSearchClient } from "@/hooks/use-opensearch-client"
import { useTranslations } from "next-intl"
import { ConnectionErrorState } from "@/components/cluster/connection-error-state"

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
  const t = useTranslations()

  // 使用自定义 hooks
  const { indices, loading: indicesLoading, error: indicesError, retrying, refresh, retry } = useIndices(clusterId)
  const { loading: executing, results, executionTime, executeQuery, resetResults } = useQueryExecution(clusterId, {
    onSuccess: refresh
  })
  const client = useOpenSearchClient(clusterId)

  // 处理编辑器拖拽调整大小
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return

    const container = document.querySelector('.editor-container')
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const newHeight = Math.max(100, Math.min(400, e.clientY - containerRect.top))
    setEditorHeight(newHeight)
  }, [])

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
          title: t("common.error.unknown"),
          description: t("clusters.query.workspace.template.load_error"),
          variant: "destructive",
        })
      }
    }

    fetchTemplates()
  }, [clusterId, toast, t])

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
        title: t("clusters.query.workspace.index_required"),
        description: t("clusters.query.workspace.select_index"),
        variant: "destructive",
      })
      return
    }

    try {
      // 替换路径中的 {index} 占位符
      const processedPath = path.replace("{index}", selectedIndex)

      // Check if this is a bulk operation
      const isBulkOperation = processedPath.includes('_bulk')

      let parsedBody
      if (isBulkOperation) {
        // For bulk operations, pass the body as a raw string (NDJSON format)
        parsedBody = queryBody && queryBody.trim() !== '' ? queryBody : undefined
      } else {
        // For non-bulk operations, parse as JSON
        try {
          parsedBody = queryBody && queryBody.trim() !== '' ? JSON.parse(queryBody) : undefined
        } catch (e) {
          toast({
            title: t("clusters.query.workspace.json_error"),
            description: e instanceof Error ? e.message : t("clusters.query.workspace.check_json"),
            variant: "destructive",
          })
          return
        }
      }

      await executeQuery(method, processedPath, parsedBody)
    } catch (error) {
      console.error("Error executing query:", error)
    }
  }

  // 当连接错误时显示友好的错误页面
  if (indicesError && indices.length === 0 && !indicesLoading) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <ConnectionErrorState
          onRetry={retry}
          retrying={retrying}
          variant="full"
        />
      </div>
    )
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
                  title: t("clusters.query.workspace.template.saved"),
                  description: t("clusters.query.workspace.template.save_success"),
                })
              } catch (error) {
                console.error("Error saving template:", error)
                toast({
                  title: t("common.error.unknown"),
                  description: t("clusters.query.workspace.template.save_error"),
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
                  title: t("clusters.query.workspace.template.deleted"),
                  description: t("clusters.query.workspace.template.delete_success"),
                })
              } catch (error) {
                console.error("Error deleting template:", error)
                toast({
                  title: t("common.error.unknown"),
                  description: t("clusters.query.workspace.template.delete_error"),
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
                  placeholder={t("clusters.query.workspace.path_placeholder")}
                  className="flex-1"
                />
                {path.includes("{index}") && (
                  <IndexSelector
                    indices={indices}
                    selectedIndex={selectedIndex}
                    onIndexChange={setSelectedIndex}
                  />
                )}
                {(() => {
                  // Only show generate template button for single document insert operations
                  // Check if this is a document insert operation (/_doc but not /_bulk or /_search)
                  const isDocInsert = path.includes("/_doc") && !path.includes("/_bulk") && !path.includes("/_search");

                  if (!isDocInsert) {
                    return null;
                  }

                  // Determine the actual index to use for template generation
                  let indexForTemplate: string | null = null;

                  if (path.includes("{index}") && selectedIndex !== "__placeholder__" && selectedIndex !== "*" && selectedIndex !== "_all") {
                    // Using placeholder syntax with selected index
                    indexForTemplate = selectedIndex;
                  } else if (path.includes("/_doc")) {
                    // Try to extract index from manually typed path like "my-index/_doc" or "/my-index/_doc"
                    const pathParts = path.replace(/^\//, '').split('/');
                    if (pathParts.length >= 1 && pathParts[0] && !pathParts[0].startsWith('_')) {
                      indexForTemplate = pathParts[0];
                    }
                  }

                  return indexForTemplate ? (
                    <TemplateGeneratorButton
                      client={client}
                      index={indexForTemplate}
                      onGenerated={setQueryBody}
                    />
                  ) : null;
                })()}
                <Button
                  onClick={handleExecute}
                  disabled={executing || !path || (path.includes("{index}") && (selectedIndex === "__placeholder__" || !selectedIndex))}
                >
                  {executing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  <span className="ml-2">{t("clusters.query.workspace.execute")}</span>
                </Button>
              </div>
            </div>

            <div className="flex-none p-4">
              <div className="editor-container relative border">
                <div style={{ height: editorHeight }}>
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