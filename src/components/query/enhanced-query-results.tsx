import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useMemo, useEffect } from "react"
import { EmptyState } from "./components/empty-state"
import { JsonView } from "./components/json-view"
import { TableView } from "./components/table-view"
import { extractTableData, isTableData, transformToTableData } from "./utils/table-utils"
import { formatJsonString } from "./utils/json-utils"
import { useTranslations } from "next-intl"

interface EnhancedQueryResultsProps {
  results: unknown
  executionTime: number | null
}

export function EnhancedQueryResults({ results, executionTime }: EnhancedQueryResultsProps): JSX.Element {
  const t = useTranslations()

  // Determine if we can show table view
  const showTable = useMemo(() => {
    if (!results) return false
    const data = extractTableData(results)
    return isTableData(data)
  }, [results])

  // Set initial active tab based on data type
  const [activeTab, setActiveTab] = useState<string>("json")

  // Update active tab when results change
  useEffect(() => {
    if (showTable) {
      setActiveTab('table')
    }else{
      setActiveTab('json')
    }
  }, [showTable])

  // Transform data for table view
  const tableData = useMemo(() => {
    if (!results) return { columns: [], rows: [] }
    const data = extractTableData(results)
    return isTableData(data) ? transformToTableData(data) : { columns: [], rows: [] }
  }, [results])

  // Format JSON string
  const formattedJson = useMemo(() => formatJsonString(results), [results])

  // Format execution time to seconds with 2 decimal places
  const formatExecutionTime = (ms: number | null): string => {
    if (ms === null) return ''
    return t("clusters.query.results.execution_time", { seconds: (ms / 1000).toFixed(2) })
  }

  return (
    <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="text-sm text-muted-foreground">
          {formatExecutionTime(executionTime)}
        </div>
        <TabsList>
          {showTable && <TabsTrigger value="table">{t("clusters.query.results.view.table")}</TabsTrigger>}
          <TabsTrigger value="json">{t("clusters.query.results.view.json")}</TabsTrigger>
        </TabsList>
      </div>

      <div className="flex-1 relative overflow-auto">
        {showTable && (
          <TabsContent value="table" className="absolute inset-0 m-0 data-[state=active]:h-full">
            {!results ? (
              <EmptyState />
            ) : (
              <TableView 
                columns={tableData.columns}
                data={tableData.rows}
              />
            )}
          </TabsContent>
        )}

        <TabsContent value="json" className="absolute inset-0 m-0 data-[state=active]:h-full">
          {!results ? (
            <EmptyState />
          ) : (
            <JsonView value={formattedJson} />
          )}
        </TabsContent>
      </div>
    </Tabs>
  )
}