"use client"

import { useState } from "react"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText } from "lucide-react"
import { Card } from "@/components/ui/card"

interface QueryTemplate {
  name: string
  description: string
  method: string
  path: string
  body?: string
}

const QUERY_TEMPLATES: QueryTemplate[] = [
  {
    name: "查看所有索引",
    description: "列出所有索引的基本信息",
    method: "GET",
    path: "/_cat/indices?v=true",
  },
  {
    name: "基本搜索",
    description: "在指定索引中搜索文档",
    method: "POST",
    path: "/{index}/_search",
    body: JSON.stringify({
      query: {
        match_all: {}
      },
      size: 10,
      from: 0
    }, null, 2)
  },
  {
    name: "精确匹配",
    description: "使用 term 查询精确匹配字段值",
    method: "POST",
    path: "/{index}/_search",
    body: JSON.stringify({
      query: {
        term: {
          "{field}": "{value}"
        }
      }
    }, null, 2)
  },
  {
    name: "多字段搜索",
    description: "在多个字段中搜索关键词",
    method: "POST",
    path: "/{index}/_search",
    body: JSON.stringify({
      query: {
        multi_match: {
          query: "{keyword}",
          fields: ["{field1}", "{field2}"],
          type: "best_fields"
        }
      }
    }, null, 2)
  },
  {
    name: "范围查询",
    description: "使用范围条件查询数值或日期字段",
    method: "POST",
    path: "/{index}/_search",
    body: JSON.stringify({
      query: {
        range: {
          "{field}": {
            gte: "{min_value}",
            lte: "{max_value}"
          }
        }
      }
    }, null, 2)
  },
  {
    name: "复合查询",
    description: "使用 bool 查询组合多个条件",
    method: "POST",
    path: "/{index}/_search",
    body: JSON.stringify({
      query: {
        bool: {
          must: [
            { match: { "{field1}": "{value1}" } }
          ],
          should: [
            { match: { "{field2}": "{value2}" } }
          ],
          must_not: [
            { term: { "{field3}": "{value3}" } }
          ],
          filter: [
            { range: { "{field4}": { gte: "{min}", lte: "{max}" } } }
          ]
        }
      }
    }, null, 2)
  },
  {
    name: "聚合分析",
    description: "对字段进行聚合统计",
    method: "POST",
    path: "/{index}/_search",
    body: JSON.stringify({
      size: 0,
      aggs: {
        field_stats: {
          terms: {
            field: "{field}",
            size: 10
          }
        }
      }
    }, null, 2)
  },
  {
    name: "高级聚合",
    description: "使用多层聚合进行复杂分析",
    method: "POST",
    path: "/{index}/_search",
    body: JSON.stringify({
      size: 0,
      aggs: {
        group_by_field: {
          terms: {
            field: "{field1}",
            size: 10
          },
          aggs: {
            avg_value: {
              avg: {
                field: "{field2}"
              }
            },
            date_histogram: {
              date_histogram: {
                field: "{date_field}",
                calendar_interval: "1d"
              }
            }
          }
        }
      }
    }, null, 2)
  },
  {
    name: "模糊查询",
    description: "使用模糊匹配搜索文档",
    method: "POST",
    path: "/{index}/_search",
    body: JSON.stringify({
      query: {
        fuzzy: {
          "{field}": {
            value: "{value}",
            fuzziness: "AUTO"
          }
        }
      }
    }, null, 2)
  },
  {
    name: "高亮显示",
    description: "搜索结果中高亮显示匹配的文本",
    method: "POST",
    path: "/{index}/_search",
    body: JSON.stringify({
      query: {
        match: {
          "{field}": "{value}"
        }
      },
      highlight: {
        fields: {
          "{field}": {}
        }
      }
    }, null, 2)
  },
  {
    name: "排序和分页",
    description: "对搜索结果进行排序和分页",
    method: "POST",
    path: "/{index}/_search",
    body: JSON.stringify({
      query: {
        match_all: {}
      },
      sort: [
        { "{field1}": "desc" },
        { "{field2}": { order: "asc", missing: "_last" } }
      ],
      from: 0,
      size: 20
    }, null, 2)
  },
  {
    name: "字段折叠",
    description: "按字段值对结果进行去重",
    method: "POST",
    path: "/{index}/_search",
    body: JSON.stringify({
      query: {
        match_all: {}
      },
      collapse: {
        field: "{field}"
      },
      sort: ["_score"],
      from: 0,
      size: 10
    }, null, 2)
  }
]

interface QueryTemplatesProps {
  onSelect: (template: QueryTemplate) => void
}

export function QueryTemplates({ onSelect }: QueryTemplatesProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          查询模板
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[1000px] sm:w-[1200px] max-w-[90vw]">
        <SheetHeader>
          <SheetTitle>查询模板</SheetTitle>
          <SheetDescription>
            选择一个预定义的查询模板快速开始
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 h-[calc(100vh-200px)] mt-4">
          <div className="grid gap-4">
            {QUERY_TEMPLATES.map((template) => (
              <Card
                key={template.name}
                className="p-4 cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  onSelect(template)
                  setOpen(false)
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{template.name}</h3>
                    <span className="text-sm text-muted-foreground">{template.method}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                  <div className="font-mono text-sm bg-muted p-2 rounded-md">
                    {template.path}
                  </div>
                  {template.body && (
                    <pre className="text-sm bg-muted p-2 rounded-md overflow-x-auto">
                      {template.body}
                    </pre>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
        <SheetFooter className="mt-4">
          <SheetClose asChild>
            <Button variant="outline" size="sm">
              关闭
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
} 