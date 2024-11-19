import { ColumnDef } from "@tanstack/react-table"

export interface TableData {
  columns: ColumnDef<Record<string, unknown>, any>[]
  rows: Record<string, unknown>[]
}

export function isTableData(data: unknown): data is Record<string, unknown>[] {
  if (!data) return false
  
  // Handle OpenSearch response format
  if (typeof data === 'object' && data !== null) {
    // Check if it's an OpenSearch response
    const hits = (data as any)?.hits?.hits
    if (Array.isArray(hits) && hits.length > 0) {
      // Check if _source exists in the first hit
      return typeof hits[0]._source === 'object' && hits[0]._source !== null
    }
    
    // If it's a direct array of objects
    if (Array.isArray(data) && data.length > 0) {
      return typeof data[0] === 'object' && data[0] !== null
    }
  }
  
  return false
}

export function extractTableData(results: unknown): unknown {
  if (!results) return null

  // Handle OpenSearch response format
  if (typeof results === 'object' && results !== null) {
    // Handle nested response structure
    if ('data' in results && typeof results.data === 'object' && results.data !== null) {
      results = results.data
    }

    // Extract hits from OpenSearch response
    const hits = (results as any).hits?.hits
    if (Array.isArray(hits)) {
      // Transform the hits array to extract _source and add metadata if needed
      return hits.map(hit => {
        const source = hit._source || {}
        return source
      })
    }

    // If it's a direct array of objects
    if (Array.isArray(results)) {
      return results
    }
  }

  return results
}

export function transformToTableData(data: Record<string, unknown>[]): TableData {
  if (!data.length) return { columns: [], rows: [] }

  // Get all unique keys from all objects
  const allKeys = new Set<string>()
  data.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key))
  })

  // Create columns with proper configuration for sorting and filtering
  const columns: ColumnDef<Record<string, unknown>, any>[] = Array.from(allKeys).map(key => ({
    id: key,
    // Use accessor function instead of accessorKey for fields with dots
    accessorFn: (row: Record<string, unknown>) => row[key],
    header: key,
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) => {
      const value = row.getValue(key)
      if (value === null || value === undefined) return ''
      if (Array.isArray(value)) {
        return value.join(', ')
      }
      if (typeof value === 'object') {
        return JSON.stringify(value)
      }
      return String(value)
    }
  }))

  // Add unique id to each row for table operations
  const rows = data.map((item, index) => ({
    id: index,
    ...item
  }))

  return {
    columns,
    rows
  }
}
