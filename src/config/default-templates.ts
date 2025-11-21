export interface QueryTemplate {
  id: string
  name: string
  description: string
  method: string
  path: string
  body: string
  tags: string[]
  category: string
  isDefault?: boolean
  docUrl?: string
}

export const defaultTemplates: QueryTemplate[] = [
  // Cluster Health & Status
  {
    id: "cluster-health",
    name: "Cluster Health",
    description: "Get cluster health status including number of nodes, shards etc.",
    method: "GET",
    path: "/_cluster/health",
    body: "",
    tags: ["cluster", "health", "monitoring"],
    category: "Cluster Management",
    isDefault: true,
    docUrl: "https://opensearch.org/docs/latest/api-reference/cluster-api/cluster-health/",
  },
  {
    id: "cluster-stats",
    name: "Cluster Stats",
    description: "Get cluster statistics including memory usage, disk space etc.",
    method: "GET",
    path: "/_cluster/stats",
    body: "",
    tags: ["cluster", "stats", "monitoring"],
    category: "Cluster Management",
    isDefault: true,
    docUrl: "https://opensearch.org/docs/latest/api-reference/cluster-api/cluster-stats/",
  },

  // Index Management
  {
    id: "indices-list",
    name: "List All Indices",
    description: "List all indices with their basic information",
    method: "GET",
    path: "/_cat/indices?v=true&s=index&format=json",
    body: "",
    tags: ["indices", "list", "cat"],
    category: "Index Management",
    isDefault: true,
    docUrl: "https://opensearch.org/docs/latest/api-reference/cat/cat-indices/",
  },
  {
    id: "create-index",
    name: "Create Index",
    description: "Create a new index with custom settings and mappings",
    method: "PUT",
    path: "/{index}",
    body: `{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1
  },
  "mappings": {
    "properties": {
      "field1": { "type": "text" },
      "field2": { "type": "keyword" },
      "field3": { "type": "date" }
    }
  }
}`,
    tags: ["indices", "create", "mapping"],
    category: "Index Management",
    isDefault: true,
    docUrl: "https://opensearch.org/docs/latest/api-reference/index-apis/create-index/",
  },
  {
    id: "index-settings",
    name: "Get Index Settings",
    description: "Get settings for specific index or indices",
    method: "GET",
    path: "/{index}/_settings",
    body: "",
    tags: ["index", "settings"],
    category: "Index Management",
    isDefault: true,
    docUrl: "https://opensearch.org/docs/latest/api-reference/index-apis/get-settings/",
  },
  {
    id: "index-mapping",
    name: "Get Index Mapping",
    description: "Get mapping for specific index or indices",
    method: "GET",
    path: "/{index}/_mapping",
    body: "",
    tags: ["index", "mapping"],
    category: "Index Management",
    isDefault: true,
    docUrl: "https://opensearch.org/docs/latest/api-reference/index-apis/get-mapping/",
  },
  {
    id: "index-stats",
    name: "Get Index Stats",
    description: "Get statistics for specific index or indices",
    method: "GET",
    path: "/{index}/_stats",
    body: "",
    tags: ["index", "stats"],
    category: "Index Management",
    isDefault: true,
    docUrl: "https://opensearch.org/docs/latest/api-reference/index-apis/get-stats/",
  },

  // Search & Query
  {
    id: "search-query",
    name: "Basic Search",
    description: "Perform a basic search query with various options",
    method: "POST",
    path: "/{index}/_search",
    body: `{
  "query": {
    "bool": {
      "must": [
        { "match": { "field1": "value1" } }
      ],
      "filter": [
        { "term": { "field2": "value2" } }
      ]
    }
  },
  "sort": [
    { "field3": { "order": "desc" } }
  ],
  "from": 0,
  "size": 20
}`,
    tags: ["search", "query", "bool"],
    category: "Search Operations",
    isDefault: true,
    docUrl: "https://opensearch.org/docs/latest/query-dsl/",
  },
  {
    id: "aggregation-query",
    name: "Basic Aggregation",
    description: "Perform basic aggregations on your data",
    method: "POST",
    path: "/{index}/_search",
    body: `{
  "size": 0,
  "aggs": {
    "my_terms_agg": {
      "terms": {
        "field": "field2",
        "size": 10
      }
    },
    "my_stats_agg": {
      "stats": {
        "field": "numeric_field"
      }
    }
  }
}`,
    tags: ["search", "aggregation", "analytics"],
    category: "Search Operations",
    isDefault: true,
    docUrl: "https://opensearch.org/docs/latest/aggregations/",
  },
  {
    id: "update-settings",
    name: "Update Settings",
    description: "Update index settings",
    method: "PUT",
    path: "/{index}/_settings",
    body: `{
  "index": {
    "number_of_replicas": 2,
    "refresh_interval": "30s"
  }
}`,
    tags: ["settings", "configuration"],
    category: "Index Management",
    isDefault: true,
    docUrl: "https://opensearch.org/docs/latest/api-reference/index-apis/update-settings/",
  },

  // Node Information
  {
    id: "nodes-info",
    name: "Nodes Info",
    description: "Get information about nodes in the cluster",
    method: "GET",
    path: "/_nodes/_all",
    body: "",
    tags: ["nodes", "info", "monitoring"],
    category: "Cluster Management",
    isDefault: true,
    docUrl: "https://opensearch.org/docs/latest/api-reference/nodes-apis/nodes-info/",
  },
  {
    id: "nodes-stats",
    name: "Nodes Stats",
    description: "Get statistics about nodes in the cluster",
    method: "GET",
    path: "/_nodes/stats",
    body: "",
    tags: ["nodes", "stats", "monitoring"],
    category: "Cluster Management",
    isDefault: true,
    docUrl: "https://opensearch.org/docs/latest/api-reference/nodes-apis/nodes-stats/",
  },
  // Document Operations
  {
    id: "list-documents",
    name: "List All Documents",
    description: "List all documents in an index with pagination",
    method: "POST",
    path: "/{index}/_search",
    body: `{
  "query": {
    "match_all": {}
  },
  "from": 0,
  "size": 100
}`,
    tags: ["document", "list", "search", "query"],
    category: "Document Operations",
    isDefault: true,
    docUrl: "https://opensearch.org/docs/latest/api-reference/search/",
  },
  {
    id: "insert-document",
    name: "Insert Document",
    description: "Insert a single document into an index",
    method: "POST",
    path: "/{index}/_doc",
    body: `{
  "field1": "value1",
  "field2": "value2",
  "field3": "2024-01-01",
  "field4": 100,
  "field5": {
    "nested1": "value",
    "nested2": 42
  },
  "field6": ["tag1", "tag2"],
  "field7": true
}`,
    tags: ["document", "insert", "index"],
    category: "Document Operations",
    isDefault: true,
    docUrl: "https://opensearch.org/docs/latest/api-reference/document-apis/index-document/",
  },
  {
    id: "bulk-insert",
    name: "Bulk Insert Documents",
    description: "Insert multiple documents in a single request",
    method: "POST",
    path: "/_bulk",
    body: `{"index":{"_index":"my-index"}}
{"field1":"doc1-value1","field2":"doc1-value2"}
{"index":{"_index":"my-index"}}
{"field1":"doc2-value1","field2":"doc2-value2"}
`,
    tags: ["document", "bulk", "insert", "index"],
    category: "Document Operations",
    isDefault: true,
    docUrl: "https://opensearch.org/docs/latest/api-reference/document-apis/bulk/",
  }
];
