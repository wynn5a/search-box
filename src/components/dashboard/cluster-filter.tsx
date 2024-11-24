"use client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslations } from 'next-intl'

interface ClusterFilterProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  healthFilter: string
  onHealthFilterChange: (value: string) => void
}

export function ClusterFilter({
  searchTerm,
  onSearchChange,
  healthFilter,
  onHealthFilterChange
}: ClusterFilterProps) {
  const t = useTranslations('home.overview')

  return (
    <div className="flex gap-2">
      <Input
        placeholder={t('search.placeholder')}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-[200px]"
      />
      <Select value={healthFilter} onValueChange={onHealthFilterChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder={t('filter.health.placeholder')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filter.health.all')}</SelectItem>
          <SelectItem value="green">{t('filter.health.healthy')}</SelectItem>
          <SelectItem value="red">{t('filter.health.unhealthy')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
