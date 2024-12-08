"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Index } from "@/hooks/use-indices"
import { useTranslations } from "next-intl"

interface IndexSelectorProps {
  indices: Index[]
  selectedIndex: string
  onIndexChange: (index: string) => void
}

export function IndexSelector({ indices, selectedIndex, onIndexChange }: IndexSelectorProps) {
  const t = useTranslations();

  return (
    <Select value={selectedIndex} onValueChange={onIndexChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder={t('common.select.placeholder')} />
      </SelectTrigger>
      <SelectContent>
        <ScrollArea className="h-[200px] max-w-[600px]">
          <SelectItem value="__placeholder__" disabled>{t('common.select.placeholder')}</SelectItem>
          <SelectItem value="*">{t('common.select.all.star')}</SelectItem>
          <SelectItem value="_all">{t('common.select.all.all')}</SelectItem>
          {indices.filter(i => !i.index.startsWith(".")).length > 0 && (
            <>
              <div className="px-2 py-1.5 text-sm font-semibold">{t('common.select.userIndices')}</div>
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
              <div className="px-2 py-1.5 text-sm font-semibold">{t('common.select.systemIndices')}</div>
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
