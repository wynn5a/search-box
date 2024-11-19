import { SearchX } from "lucide-react"

export function EmptyState() {
  return (
    <div className="h-full border rounded-md relative flex flex-col items-center justify-center text-muted-foreground">
      <SearchX className="h-12 w-12 mb-4 opacity-50" />
      <p className="text-lg font-medium mb-1">No results found</p>
      <p className="text-sm">Run a query to see the results here</p>
    </div>
  )
}
