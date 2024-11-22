"use client"
import React, { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Tabs,
  TabsContent,
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
import type { ClusterSettings as ClusterSettingsType, SettingGroup, SettingType } from "./types"
import { organizeSettings } from "./utils"

interface Props {
  clusterId: string
}

export function ClusterSettings({ clusterId }: Props) {
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
          title: "获取设置失败",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "获取设置失败",
        description: error instanceof Error ? error.message : "未知错误",
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
      return <span className="text-muted-foreground">-</span>;
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
                Level {depth}
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
              {entries.map(([key, value], index) => (
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
    <div className="container mx-auto p-4">
      
      <div className="mb-6 flex items-center gap-4 justify-between">
        <Input
          placeholder="搜索设置..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button
          variant="outline"
          onClick={fetchSettings}
          disabled={loading}
        >
          刷新
        </Button>
      </div>

      <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as SettingType)}>
        <TabsList>
          <TabsTrigger value="persistent">持久设置</TabsTrigger>
          <TabsTrigger value="transient">临时设置</TabsTrigger>
          <TabsTrigger value="defaults">默认设置</TabsTrigger>
        </TabsList>

        <TabsContent value="persistent">
          <ScrollArea className="h-[calc(100vh-100px)]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              getSettingsForType('persistent').map((group, index) => (
                <div key={index}>
                  {renderSettingGroup(group)}
                </div>
              ))
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="transient">
          <ScrollArea className="h-[600px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              getSettingsForType('transient').map((group, index) => (
                <div key={index}>
                  {renderSettingGroup(group)}
                </div>
              ))
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="defaults">
          <ScrollArea className="h-[600px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              getSettingsForType('defaults').map((group, index) => (
                <div key={index}>
                  {renderSettingGroup(group)}
                </div>
              ))
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
