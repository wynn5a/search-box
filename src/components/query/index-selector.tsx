import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Index } from "@/hooks/use-indices"

interface IndexSelectorProps {
  indices: Index[]
  selectedIndex: string
  onIndexChange: (index: string) => void
}

export function IndexSelector({ indices, selectedIndex, onIndexChange }: IndexSelectorProps) {
  return (
    <Select value={selectedIndex} onValueChange={onIndexChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select index" />
      </SelectTrigger>
      <SelectContent>
        <ScrollArea className="h-[200px]">
          <SelectItem value="__placeholder__" disabled>Select an index</SelectItem>
          <SelectItem value="*">All indices (*)</SelectItem>
          <SelectItem value="_all">All indices (_all)</SelectItem>
          {indices.filter(i => !i.index.startsWith(".")).length > 0 && (
            <>
              <div className="px-2 py-1.5 text-sm font-semibold">User Indices</div>
              {indices
                .filter(i => !i.index.startsWith("."))
                .map(i => (
                  <SelectItem key={i.index} value={i.index}>
                    {i.index}
                  </SelectItem>
                ))
              }
            </>
          )}
          {indices.filter(i => i.index.startsWith(".")).length > 0 && (
            <>
              <div className="px-2 py-1.5 text-sm font-semibold">System Indices</div>
              {indices
                .filter(i => i.index.startsWith("."))
                .map(i => (
                  <SelectItem key={i.index} value={i.index}>
                    {i.index}
                  </SelectItem>
                ))
              }
            </>
          )}
        </ScrollArea>
      </SelectContent>
    </Select>
  )
}
