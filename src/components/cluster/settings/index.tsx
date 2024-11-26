"use client"
import React, { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
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
import { Search, RefreshCw, Database, DatabaseZap, Package } from "lucide-react"
import cn from "clsx"

interface Props {
  clusterId: string
}

export function ClusterSettings({ clusterId }: Props) {
  const t = useTranslations()
  const { toast } = useToast()
  const [settings, setSettings] = useState<ClusterSettingsType | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<SettingType>("persistent")
  const [loading, setLoading] = useState(true)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/clusters/${clusterId}/settings`)
      const data = await response.json()
      if (data.success) {
        setSettings(data.data)
      } else {
        toast({
          title: t("cluster.settings.error.load_failed.title"),
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: t("cluster.settings.error.load_failed.title"),
        description: error instanceof Error ? error.message : t("common.error.unknown"),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [clusterId])

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
      </div>

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-[350px]">
          <div className="space-y-4 pr-4">
            {loading ? (
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
      </div>
    </div>
  )
}
