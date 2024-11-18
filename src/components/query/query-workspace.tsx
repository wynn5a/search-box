"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Play, Code, FileJson, Loader2 } from "lucide-react"
import { Editor } from "@monaco-editor/react"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { QueryTemplateManager} from "./query-template-manager"
import { type QueryTemplate } from "@/config/default-templates"
import { EnhancedQueryResults } from "./enhanced-query-results"
import { useTheme } from "next-themes"
import { Input } from "../ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface QueryWorkspaceProps {
  clusterId: string
}

interface Index {
  index: string
}

export function QueryWorkspace({ clusterId }: QueryWorkspaceProps) {
  const [method, setMethod] = useState<string>("GET")
  const [path, setPath] = useState<string>("")
  const [body, setBody] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [results, setResults] = useState<any>(null)
  const [executionTime, setExecutionTime] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<"table" | "json">("table")
  const [copied, setCopied] = useState(false)
  const [customTemplates, setCustomTemplates] = useState<QueryTemplate[]>([])
  const [startTime, setStartTime] = useState<number>(0)
  const [editorHeight, setEditorHeight] = useState(200)
  const [indices, setIndices] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState<string>("__placeholder__")
  const isDragging = useRef(false)
  const { toast } = useToast()
  const { theme } = useTheme()

  // Fetch indices on mount
  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const response = await fetch(`/api/clusters/${clusterId}/indices`)
        if (!response.ok) throw new Error("Failed to fetch indices")
        const { success, data } = await response.json()
        if (success && Array.isArray(data)) {
          setIndices(data)
        }
      } catch (error) {
        console.error("Error fetching indices:", error)
        toast({
          title: "Error",
          description: "Failed to load indices",
          variant: "destructive",
        })
      }
    }

    fetchIndices()
  }, [clusterId, toast])

  const handleMouseDown = (e: React.MouseEvent) => {
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

  // Fetch custom templates on mount
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

  const executeQuery = async () => {
    try {
      // Check if path contains {index} and validate index selection
      if (path.includes("{index}") && (selectedIndex === "__placeholder__" || !selectedIndex)) {
        toast({
          title: "Index required",
          description: "Please select an index for this query",
          variant: "destructive",
        })
        return
      }

      setLoading(true)
      setStartTime(performance.now())
      let parsedBody
      try {
        parsedBody = body && body.trim() !== '' ? JSON.parse(body) : undefined
      } catch (e) {
        toast({
          title: "Invalid JSON format",
          description: "Please check your request body format",
          variant: "destructive",
        })
        return
      }

      // Replace {index} placeholder with selected index
      const processedPath = path.replace("{index}", selectedIndex)

      const response = await fetch(`/api/clusters/${clusterId}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method,
          path: processedPath,
          body: parsedBody,
        }),
      })

      const data = await response.json()
      setExecutionTime(performance.now() - startTime)
      
      if (!response.ok) {
        setResults({ error: data.error || "Query failed" })
        toast({
          title: "Query failed",
          description: data.error || "An error occurred while executing the query",
          variant: "destructive",
        })
        return
      }

      setResults(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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
                body,
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
            onSelectTemplate={(template) => {
              setMethod(template.method)
              setPath(template.path)
              setBody(template.body)
              toast({
                title: "Template loaded",
                description: "Query template has been loaded",
              })
            }}
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
                  <Select value={selectedIndex} onValueChange={setSelectedIndex}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select index" />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-[200px]">
                        <SelectItem value="__placeholder__" disabled>Select an index</SelectItem>
                        <SelectItem value="*">All indices (*)</SelectItem>
                        <SelectItem value="_all">All indices (_all)</SelectItem>
                        {indices.filter(index => !index.startsWith(".")).length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-sm font-semibold">User Indices</div>
                            {indices
                              .filter(index => !index.startsWith("."))
                              .map(index => (
                                <SelectItem key={index} value={index}>
                                  {index}
                                </SelectItem>
                              ))
                            }
                          </>
                        )}
                        {indices.filter(index => index.startsWith(".")).length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-sm font-semibold">System Indices</div>
                            {indices
                              .filter(index => index.startsWith("."))
                              .map(index => (
                                <SelectItem key={index} value={index}>
                                  {index}
                                </SelectItem>
                              ))
                            }
                          </>
                        )}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                )}
                <Button 
                  onClick={executeQuery}
                  disabled={loading || !path || (path.includes("{index}") && (selectedIndex === "__placeholder__" || !selectedIndex))}
                >
                  {loading ? (
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
                  value={body}
                  onChange={(value) => setBody(value || "")}
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
              <div className="h-full">
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