export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"

export interface QueryHistoryItem {
  id: string
  query: string
  timestamp: string
  method: HttpMethod
  path: string
}

export interface Operation {
  value: string
  label: string
  methods: HttpMethod[]
  requiresIndex: boolean
}

export interface QueryResult {
  took?: number
  timed_out?: boolean
  _shards?: {
    total: number
    successful: number
    skipped: number
    failed: number
  }
  hits?: {
    total: {
      value: number
      relation: string
    }
    max_score: number | null
    hits: Array<{
      _index: string
      _id: string
      _score: number
      _source: Record<string, any>
    }>
  }
  [key: string]: any
}

export const OPERATIONS: Operation[] = [
  // 搜索和文档操作
  { value: '_search', label: '搜索', methods: ['GET', 'POST'], requiresIndex: true },
  { value: '_count', label: '文档计数', methods: ['GET', 'POST'], requiresIndex: true },
  { value: '_mget', label: '批量获取', methods: ['GET', 'POST'], requiresIndex: true },
  { value: '_doc', label: '插入文档', methods: ['POST', 'PUT'], requiresIndex: true },
  
  // 索引操作
  { value: '_mapping', label: '映射', methods: ['GET'], requiresIndex: true },
  { value: '_settings', label: '设置', methods: ['GET'], requiresIndex: true },
  { value: '_stats', label: '统计', methods: ['GET'], requiresIndex: true },
  { value: '_segments', label: '分片段', methods: ['GET'], requiresIndex: true },
  { value: '_cache/clear', label: '清除缓存', methods: ['POST'], requiresIndex: true },
  { value: '_refresh', label: '刷新', methods: ['POST'], requiresIndex: true },
  { value: '_flush', label: '落盘', methods: ['POST'], requiresIndex: true },
  
  // 集群操作 - 不需要索引
  { value: '_cluster/health', label: '集群健康', methods: ['GET'], requiresIndex: false },
  { value: '_cluster/state', label: '集群状态', methods: ['GET'], requiresIndex: false },
  { value: '_cluster/stats', label: '集群统计', methods: ['GET'], requiresIndex: false },
  { value: '_nodes/stats', label: '节点统计', methods: ['GET'], requiresIndex: false },
  
  // 分析操作
  { value: '_analyze', label: '分析器', methods: ['GET', 'POST'], requiresIndex: true },
  { value: '_explain', label: '评分解释', methods: ['GET', 'POST'], requiresIndex: true },
  
  // 别名操作
  { value: '_alias', label: '别名', methods: ['GET'], requiresIndex: true },
  { value: '_aliases', label: '所有别名', methods: ['GET'], requiresIndex: false },
] as const

export type OperationType = typeof OPERATIONS[number]['value'] 