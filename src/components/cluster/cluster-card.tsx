"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { formatBytes } from "@/lib/utils"
import { ClusterOverview } from "@/types/cluster"
import { useTranslations } from "next-intl"
import { Database, HardDrive, Search, Settings2, List, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { eventBus, EVENTS } from "@/lib/events"

interface ClusterCardProps {
  cluster: ClusterOverview
}

export function ClusterCard({ cluster }: ClusterCardProps) {
  const t = useTranslations('clusters')
  const tCommon = useTranslations('common')
  const { toast } = useToast()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const healthColor = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  } as const

  type HealthStatus = keyof typeof healthColor

  const getHealthColor = (status: string | undefined) => {
    if (!status || !(status in healthColor)) return "bg-gray-300"
    return healthColor[status as HealthStatus]
  }

  const quickActions = [
    {
      label: t('button.details'),
      icon: List,
      href: `/clusters/${cluster.id}`
    },
    {
      label: t('button.indices'),
      icon: Database,
      href: `/clusters/${cluster.id}/indices`
    },
    {
      label: t('button.search'),
      icon: Search,
      href: `/clusters/${cluster.id}/query`
    }
  ]

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/clusters/${cluster.id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete cluster")
      
      toast({
        title: t("list.delete.success"),
        description: t("list.delete.success_description"),
      })
      
      eventBus.emit(EVENTS.CLUSTER_DELETED)
    } catch (error) {
      toast({
        title: t("list.delete.error"),
        description: t("list.delete.error_description"),
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="border-b p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${getHealthColor(cluster.health?.status)}`} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="font-semibold tracking-tight">
                    {cluster.name}
                  </h3>
                </TooltipTrigger>
                <TooltipContent
                  className="bg-background border"
                >
                  <p className="text-xs text-foreground">
                    {cluster.url}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowDeleteDialog(true)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tCommon('button.delete')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-3 gap-4 items-center justify-between">
          <div className="space-y-1 border-l pl-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">
                {cluster.stats?.indices?.count || '0'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{t('indices')}</p>
          </div>
          <div className="space-y-1 border-l pl-4">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">
                {cluster.stats?.indices?.store?.size_in_bytes
                  ? formatBytes(cluster.stats.indices.store.size_in_bytes)
                  : '0 B'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{t('storage')}</p>
          </div>
          <div className="space-y-1 border-l pl-4">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">
                {cluster.health?.number_of_nodes || '0'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{t('nodes')}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="grid grid-cols-3 gap-2 p-2">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            className="w-full hover:bg-primary/10 hover:text-primary"
            asChild
          >
            <Link href={action.href} className="flex items-center justify-center gap-2">
              <action.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{action.label}</span>
            </Link>
          </Button>
        ))}
      </CardFooter>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("list.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("list.delete.description", { name: cluster.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {tCommon("button.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tCommon("button.delete")}
                </>
              ) : (
                tCommon("button.delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}