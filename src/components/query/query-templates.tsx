"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  FileDown, FileSearch, FileText, List, Plus, Settings, 
  Search, Database, HardDrive, Activity, AlertTriangle 
} from "lucide-react"

const QUERY_TEMPLATES = {
  // 索引操作
  indices: {
    label: "索引操作",
    items: {
      getMapping: {
        label: "查看映射",
        icon: Settings,
        method: "GET",
        path: "/_mapping",
        query: "",
        description: "查看索引的字段映射信息",
        docs: "https://opensearch.org/docs/latest/api-reference/index-apis/get-mapping/",
      },
      getSettings: {
        label: "查看设置",
        icon: Settings,
        method: "GET",
        path: "/_settings",
        query: "",
        description: "查看索引的设置信息",
        docs: "https://opensearch.org/docs/latest/api-reference/index-apis/get-settings/",
      },
    },
  },
  // 文档操作
  documents: {
    label: "文档操作",
    items: {
      index: {
        label: "索引文档",
        icon: Plus,
        method: "POST",
        path: "/_doc",
        query: `{
  "field1": "value1",
  "field2": "value2"
}`,
        description: "添加或更新文档",
        docs: "https://opensearch.org/docs/latest/api-reference/document-apis/index-document/",
      },
      get: {
        label: "获取文档",
        icon: Search,
        method: "GET",
        path: "/_doc/{id}",
        query: "",
        description: "通过ID获取文档",
        docs: "https://opensearch.org/docs/latest/api-reference/document-apis/get-document/",
      },
      delete: {
        label: "删除文档",
        icon: AlertTriangle,
        method: "DELETE",
        path: "/_doc/{id}",
        query: "",
        description: "删除指定ID的文档",
        docs: "https://opensearch.org/docs/latest/api-reference/document-apis/delete-document/",
      },
    },
  },
  // 搜索操作
  search: {
    label: "搜索操作",
    items: {
      matchAll: {
        label: "匹配所有",
        icon: List,
        method: "POST",
        path: "/_search",
        query: `{
  "query": {
    "match_all": {}
  }
}`,
        description: "匹配所有文档",
        docs: "https://opensearch.org/docs/latest/query-dsl/match-all/",
      },
      match: {
        label: "字段匹配",
        icon: FileSearch,
        method: "POST",
        path: "/_search",
        query: `{
  "query": {
    "match": {
      "field": "value"
    }
  }
}`,
        description: "对指定字段进行全文搜索",
        docs: "https://opensearch.org/docs/latest/query-dsl/match/",
      },
      term: {
        label: "精确匹配",
        icon: FileSearch,
        method: "POST",
        path: "/_search",
        query: `{
  "query": {
    "term": {
      "field.keyword": "value"
    }
  }
}`,
        description: "对指定字段进行精确匹配",
        docs: "https://opensearch.org/docs/latest/query-dsl/term/",
      },
    },
  },
  // 统计分析
  analytics: {
    label: "统计分析",
    items: {
      stats: {
        label: "索引统计",
        icon: Activity,
        method: "GET",
        path: "/_stats",
        query: "",
        description: "查看索引的统计信息",
        docs: "https://opensearch.org/docs/latest/api-reference/index-apis/get-index-stats/",
      },
      segments: {
        label: "分片信息",
        icon: HardDrive,
        method: "GET",
        path: "/_segments",
        query: "",
        description: "查看索引的分片信息",
        docs: "https://opensearch.org/docs/latest/api-reference/index-apis/get-segments/",
      },
      aggs: {
        label: "聚合分析",
        icon: FileText,
        method: "POST",
        path: "/_search",
        query: `{
  "size": 0,
  "aggs": {
    "group_by_field": {
      "terms": {
        "field": "field.keyword",
        "size": 10
      }
    }
  }
}`,
        description: "对数据进行聚合分析",
        docs: "https://opensearch.org/docs/latest/aggregations/",
      },
    },
  },
}

interface QueryTemplatesProps {
  onSelect: (template: {
    method: string
    path: string
    query: string
    description: string
    docs: string
  }) => void
}

export function QueryTemplates({ onSelect }: QueryTemplatesProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">模板</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>API 模板</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(QUERY_TEMPLATES).map(([key, category]) => (
          <DropdownMenuSub key={key}>
            <DropdownMenuSubTrigger>
              <span>{category.label}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {Object.entries(category.items).map(([itemKey, item]) => {
                const Icon = item.icon
                return (
                  <DropdownMenuItem
                    key={itemKey}
                    onClick={() => onSelect(item)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 