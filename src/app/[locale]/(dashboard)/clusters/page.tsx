"use client"

import { ClustersList } from "@/components/cluster/clusters-list"
import { useTranslations } from 'next-intl'

export default function ClustersPage() {
  const t = useTranslations()
  
  return (
    <div className="flex flex-col space-y-6 py-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{t('clusters.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('clusters.description')}
        </p>
      </div>
      <ClustersList />
    </div>
  )
}
