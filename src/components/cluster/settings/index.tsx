"use client"
import React, { useState, useEffect, useCallback } from "react"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { JsonViewerContainer } from "@/components/json-viewer"
import { useTranslations } from "next-intl"
import type { ClusterSettings as ClusterSettingsType, SettingGroup, SettingType } from "./types"
import { organizeSettings } from "./utils"
import { Search, RefreshCw, Database, DatabaseZap, Package, Trash2, Loader2 } from "lucide-react"
import cn from "clsx"
import { ConnectionErrorState } from "../connection-error-state"
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
import { useRouter } from "@/routing"

interface Props {
  clusterId: string
}

export function ClusterSettings({ clusterId }: Props) {
  const t = useTranslations()
  const router = useRouter()
  const { toast } = useToast()
  const [settings, setSettings] = useState<ClusterSettingsType | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<SettingType>("persistent")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [clusterName, setClusterName] = useState<string>("")

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/clusters/${clusterId}/settings`)
      const data = await response.json()
      if (data.success) {
        setSettings(data.data)
      } else {
        setError(data.error || t("cluster.settings.error.load_failed.title"))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error.unknown"))
    } finally {
      setLoading(false)
      setRetrying(false)
    }
  }, [clusterId, t])

  const handleRetry = useCallback(() => {
    setRetrying(true)
    fetchSettings()
  }, [fetchSettings])

  const fetchClusterInfo = useCallback(async () => {
    try {
      const response = await fetch(`/api/clusters/${clusterId}`)
      if (response.ok) {
        const data = await response.json()
        setClusterName(data.name || "")
      }
    } catch (err) {
      console.error("Failed to fetch cluster info:", err)
    }
  }, [clusterId])

  const handleDeleteCluster = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/clusters/${clusterId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete cluster")
      
      toast({
        title: t("clusters.list.delete.success"),
        description: t("clusters.list.delete.success_description"),
      })
      
      eventBus.emit(EVENTS.CLUSTER_DELETED)
      router.push("/clusters")
    } catch {
      toast({
        title: t("clusters.list.delete.error"),
        description: t("clusters.list.delete.error_description"),
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  useEffect(() => {
    fetchSettings()
    fetchClusterInfo()
  }, [fetchSettings, fetchClusterInfo])

  const renderSettingValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">{t("common.value.empty")}</span>;
    }

    if (Array.isArray(value)) {
      return <JsonViewerContainer data={value} className="border-none" />
    }

    if (typeof value === "object") {
      return <JsonViewerContainer data={value} className="border-none" />
    }

    const stringValue = value.toString();
    if (stringValue.length > 50) {
      return (
        <details className="group">
          <summary className="cursor-pointer hover:text-primary font-mono">
            {stringValue.slice(0, 50)}...
          </summary>
          <div className="mt-2 rounded-md bg-muted p-2 font-mono text-sm">
            {stringValue}
          </div>
        </details>
      );
    }

    if (typeof value === "boolean") {
      return (
        <Badge variant={value ? "default" : "secondary"}>
          {value.toString()}
        </Badge>
      );
    }

    if (typeof value === "number") {
      return <Badge variant="outline">{value}</Badge>;
    }

    return <span className="text-sm font-mono">{stringValue}</span>;
  };

  const renderSettingGroup = (group: SettingGroup, path: string[] = [], depth: number = 0) => {
    if (!group || !group.settings) {
      return null;
    }

    const entries = Object.entries(group.settings)
      .filter(([key]) => 
        key.toLowerCase().includes(searchTerm.toLowerCase())
      )

    if (entries.length === 0 && (!group.subgroups || Object.keys(group.subgroups).length === 0)) {
      return null
    }

    const getBgColor = (depth: number) => {
      switch (depth % 3) {
        case 0:
          return "bg-card border shadow-sm";
        case 1:
          return "bg-muted";
        case 2:
          return "bg-accent";
      }
    };

    return (
      <Card className={`mb-4 ${getBgColor(depth)}`}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {group.name}
            {depth > 0 && (
              <Badge variant="outline" className="text-xs">
                {t("cluster.settings.level", { level: depth })}
              </Badge>
            )}
          </CardTitle>
          {group.description && (
            <CardDescription>{group.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {entries.length > 0 && (
            <div className="space-y-2">
              {entries.map(([key, value], _index) => (
                <div key={key} className="flex items-start gap-4">
                  <div className="font-mono text-sm text-muted-foreground min-w-[200px] pt-1">
                    {key}
                  </div>
                  <div className="flex-1">
                    {renderSettingValue(value)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {group.subgroups && Object.entries(group.subgroups).map(([key, subgroup], index, array) => (
            <div key={key}>
              {renderSettingGroup(subgroup, [...path, key], depth + 1)}
              {index < array.length - 1 && (
                <div className="h-px bg-border" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const getSettingsForType = (type: SettingType) => {
    if (!settings || !settings[type]) {
      return [];
    }
    const typeSettings = settings[type] || {};
    const tempSettings: ClusterSettingsType = {
      persistent: type === 'persistent' ? typeSettings : null,
      transient: type === 'transient' ? typeSettings : null,
      defaults: type === 'defaults' ? typeSettings : null,
    };
    const organized = organizeSettings(tempSettings);
    return Object.values(organized);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="relative w-[300px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("cluster.settings.search.placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Tabs defaultValue="persistent" value={selectedType} onValueChange={(v) => setSelectedType(v as SettingType)}>
            <TabsList>
              <TabsTrigger value="persistent">
                <Database className="mr-2 h-4 w-4" />
                {t("cluster.settings.type.persistent")}
              </TabsTrigger>
              <TabsTrigger value="transient">
                <DatabaseZap className="mr-2 h-4 w-4" />
                {t("cluster.settings.type.transient")}
              </TabsTrigger>
              <TabsTrigger value="defaults">
                <Package className="mr-2 h-4 w-4" />
                {t("cluster.settings.type.defaults")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchSettings}
            disabled={loading}
          >
            <RefreshCw className={cn(
              "h-4 w-4 mr-2",
              loading && "animate-spin"
            )} />
            {t("common.button.refresh")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t("cluster.settings.danger_zone.delete.button")}
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {error && !settings ? (
          <ConnectionErrorState
            onRetry={handleRetry}
            retrying={retrying}
            variant="card"
          />
        ) : (
          <ScrollArea className="h-[calc(100vh-380px)]">
            <div className="space-y-4 pr-4 pb-4">
              {loading && !retrying ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                getSettingsForType(selectedType).map((group, index) => (
                  <div key={index}>
                    {renderSettingGroup(group)}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("clusters.list.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("clusters.list.delete.description", { name: clusterName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t("common.button.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCluster}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.button.delete")}
                </>
              ) : (
                t("common.button.delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
