"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useTranslations } from "next-intl"

interface ShardsStatusProps {
  shards: {
    total: number
    active: number
    relocating: number
    initializing: number
    unassigned: number
  }
}

export function ShardsStatus({ shards }: ShardsStatusProps) {
  const t = useTranslations('shards')

  const calculatePercentage = (value: number) => {
    return shards.total > 0 ? Math.round((value / shards.total) * 100) : 0
  }

  return (
    <Card className="h-full">
      <CardHeader className="border-b bg-muted/40 p-4">
        <h3 className="text-lg font-medium">{t('title')}</h3>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('active')}</span>
            <span className="text-sm text-muted-foreground">
              {shards.active} / {shards.total}
            </span>
          </div>
          <Progress
            value={calculatePercentage(shards.active)}
            className="h-2 bg-muted"
            indicatorClassName="bg-green-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('relocating')}</span>
            <span className="text-sm text-muted-foreground">
              {shards.relocating} / {shards.total}
            </span>
          </div>
          <Progress
            value={calculatePercentage(shards.relocating)}
            className="h-2 bg-muted"
            indicatorClassName="bg-blue-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('initializing')}</span>
            <span className="text-sm text-muted-foreground">
              {shards.initializing} / {shards.total}
            </span>
          </div>
          <Progress
            value={calculatePercentage(shards.initializing)}
            className="h-2 bg-muted"
            indicatorClassName="bg-yellow-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('unassigned')}</span>
            <span className="text-sm text-muted-foreground">
              {shards.unassigned} / {shards.total}
            </span>
          </div>
          <Progress
            value={calculatePercentage(shards.unassigned)}
            className="h-2 bg-muted"
            indicatorClassName="bg-red-500"
          />
        </div>
      </CardContent>
    </Card>
  )
}
