"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Copy, Download, Table, FileJson, ChevronDown, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface EnhancedQueryResultsProps {
  results: any
  error?: string
  executionTime?: number|null
}

export function EnhancedQueryResults({
  results,
  error,
  executionTime,
}: EnhancedQueryResultsProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const togglePath = (path: string) => {
    const newPaths = new Set(expandedPaths)
    if (newPaths.has(path)) {
      newPaths.delete(path)
    } else {
      newPaths.add(path)
    }
    setExpandedPaths(newPaths)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied to clipboard",
        description: "Query results have been copied to your clipboard",
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const downloadResults = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `query-results-${new Date().toISOString()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const renderValue = (value: any): JSX.Element => {
    if (value === null) return <span className="text-muted-foreground">null</span>
    if (typeof value === "boolean")
      return (
        <span className="text-blue-500">{value ? "true" : "false"}</span>
      )
    if (typeof value === "number")
      return <span className="text-purple-500">{value}</span>
    if (typeof value === "string")
      return <span className="text-green-500">"{value}"</span>
    if (Array.isArray(value))
      return <span className="text-muted-foreground">[Array: {value.length}]</span>
    if (typeof value === "object")
      return (
        <span className="text-muted-foreground">
          {"{Object: "}
          {Object.keys(value).length}
          {" properties}"}
        </span>
      )
    return <span>{String(value)}</span>
  }

  const renderObject = (obj: any, path = "", depth = 0): JSX.Element => {
    if (typeof obj !== "object" || obj === null) {
      return <div className="ml-6">{renderValue(obj)}</div>
    }

    return (
      <div className="space-y-1">
        {Object.entries(obj).map(([key, value]) => {
          const currentPath = path ? `${path}.${key}` : key
          const isExpanded = expandedPaths.has(currentPath)
          const hasChildren =
            value !== null && typeof value === "object"

          return (
            <div key={currentPath} style={{ marginLeft: `${depth * 16}px` }}>
              <div
                className="flex items-center space-x-2 hover:bg-accent rounded px-2 py-1 cursor-pointer"
                onClick={() => hasChildren && togglePath(currentPath)}
              >
                {hasChildren && (
                  <span className="text-muted-foreground">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </span>
                )}
                <span className="text-blue-500">{key}:</span>
                {!isExpanded && renderValue(value)}
              </div>
              {hasChildren && isExpanded && renderObject(value, currentPath, depth + 1)}
            </div>
          )
        })}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <Card className="p-4 border-destructive">
          <p className="text-destructive">{error}</p>
        </Card>
      </div>
    )
  }

  if (!results) return null

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium">Query Results</h3>
            {executionTime && (
              <Badge variant="secondary">
                {executionTime.toFixed(2)}ms
              </Badge>
            )}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(JSON.stringify(results, null, 2))}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadResults}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="tree" className="flex-1 min-h-0 flex flex-col">
        <div className="flex-none px-4">
          <TabsList>
            <TabsTrigger value="tree">
              <Table className="h-4 w-4 mr-2" />
              Tree View
            </TabsTrigger>
            <TabsTrigger value="json">
              <FileJson className="h-4 w-4 mr-2" />
              JSON View
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 min-h-0">
          <TabsContent value="tree" className="h-full m-0 data-[state=active]:flex">
            <ScrollArea className="flex-1">
              <div className="p-4">
                {renderObject(results)}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="json" className="h-full m-0 data-[state=active]:flex">
            <ScrollArea className="flex-1">
              <pre className="p-4 text-sm whitespace-pre-wrap">
                {JSON.stringify(results, null, 2)}
              </pre>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
