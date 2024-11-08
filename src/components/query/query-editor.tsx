"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Play, Code, ExternalLink } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Editor from "@monaco-editor/react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { QueryTemplates } from "./query-templates"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

interface QueryResult {
  took?: number
  hits?: {
    total?: {
      value: number
      relation: string
    }
    hits?: any[]
  }
  [key: string]: any
}

interface IndexInfo {
  index: string
  health: string
  status: string
}

interface QueryTemplate {
  method: string
  path: string
  query: string
  description: string
  docs: string
}

export function QueryEditor({ clusterId }: { clusterId: string }) {
  const [query, setQuery] = useState('{\n  "query": {\n    "match_all": {}\n  }\n}')
  const [index, setIndex] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [indices, setIndices] = useState<IndexInfo[]>([])
  const [method, setMethod] = useState("POST")
  const [path, setPath] = useState("/_search")
  const [description, setDescription] = useState("")
  const [docs, setDocs] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const response = await fetch(`/api/clusters/${clusterId}/indices`)
        if (!response.ok) throw new Error("Failed to fetch indices")
        const data = await response.json()
        setIndices(data)
      } catch (error) {
        toast({
          title: "获取索引列表失败",
          description: "请稍后重试",
          variant: "destructive",
        })
      }
    }

    fetchIndices()
  }, [clusterId])

  const handleTemplateSelect = (template: QueryTemplate) => {
    setMethod(template.method)
    setPath(template.path)
    setQuery(template.query)
    setDescription(template.description)
    setDocs(template.docs)
  }

  const executeQuery = async () => {
    if (!index) {
      toast({
        title: "请选择索引",
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
          index,
          query,
          method,
          path,
        }),
      })

      if (!response.ok) throw new Error("Query failed")
      const data = await response.json()
      setResult(data)
    } catch (error) {
      toast({
        title: "查询失败",
        description: error instanceof Error ? error.message : "请检查查询语法",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 将索引分为用户索引和系统索引
  const userIndices = indices.filter(i => !i.index.startsWith('.'))
  const systemIndices = indices.filter(i => i.index.startsWith('.'))

  const requestUri = `${index}${path}`

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={index} onValueChange={setIndex}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="选择索引" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>用户索引</SelectLabel>
              {userIndices.map((idx) => (
                <SelectItem 
                  key={idx.index} 
                  value={idx.index}
                >
                  {idx.index}
                </SelectItem>
              ))}
            </SelectGroup>
            {systemIndices.length > 0 && (
              <SelectGroup>
                <SelectLabel>系统索引</SelectLabel>
                {systemIndices.map((idx) => (
                  <SelectItem 
                    key={idx.index} 
                    value={idx.index}
                  >
                    {idx.index}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
        <QueryTemplates onSelect={handleTemplateSelect} />
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Code className="h-4 w-4" />
              {method} {requestUri}
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">请求详情</h4>
              <div className="text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">方法:</span>
                  <span className="col-span-2">{method}</span>
                  <span className="font-medium">索引:</span>
                  <span className="col-span-2">{index || '未选择'}</span>
                  <span className="font-medium">路径:</span>
                  <span className="col-span-2">{path}</span>
                  <span className="font-medium">完整URI:</span>
                  <span className="col-span-2 break-all">{requestUri}</span>
                </div>
                {description && (
                  <>
                    <div className="mt-2 border-t pt-2">
                      <p>{description}</p>
                    </div>
                    {docs && (
                      <a
                        href={docs}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex items-center gap-1 text-xs text-blue-500 hover:underline"
                      >
                        查看文档
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
        <Button
          onClick={executeQuery}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              执行中...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              执行查询
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2">
        <Card className="p-4">
          <Editor
            height="400px"
            defaultLanguage="json"
            value={query}
            onChange={(value) => setQuery(value || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </Card>

        <Card className="p-4">
          <Tabs defaultValue="json">
            <TabsList>
              <TabsTrigger value="json">JSON视图</TabsTrigger>
              <TabsTrigger value="table">表格视图</TabsTrigger>
            </TabsList>
            <TabsContent value="json" className="mt-2">
              {result && (
                <pre className="text-sm overflow-auto max-h-[500px]">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </TabsContent>
            <TabsContent value="table" className="mt-2">
              {result && result.hits?.hits ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      找到 {result.hits?.total?.value ?? 0} 条记录
                      {result.took !== undefined && `，耗时 ${result.took}ms`}
                    </div>
                  </div>
                  <ScrollArea className="h-[500px] rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">_id</TableHead>
                          <TableHead>_score</TableHead>
                          {result.hits.hits[0]?._source && 
                            Object.keys(result.hits.hits[0]._source).map((field) => (
                              <TableHead key={field}>{field}</TableHead>
                            ))
                          }
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.hits.hits.map((hit) => (
                          <TableRow key={hit._id}>
                            <TableCell className="font-medium">{hit._id}</TableCell>
                            <TableCell>{hit._score}</TableCell>
                            {hit._source && Object.keys(hit._source).map((field) => (
                              <TableCell key={field}>
                                {typeof hit._source[field] === 'object' 
                                  ? JSON.stringify(hit._source[field])
                                  : String(hit._source[field])
                                }
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  {Object.keys(result || {}).length > 0 ? "数据以 JSON 格式显示" : "没有找到匹配的数据"}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
} 