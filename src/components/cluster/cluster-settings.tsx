"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { RefreshCw, Settings2, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface ClusterSettings {
  persistent: Record<string, any> | null
  transient: Record<string, any> | null
  defaults: Record<string, any> | null
}

interface ClusterSettingsProps {
  clusterId: string
}

export function ClusterSettings({ clusterId }: ClusterSettingsProps) {
  const [settings, setSettings] = useState<ClusterSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const fetchSettings = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/clusters/${clusterId}/settings`)
      if (!response.ok) throw new Error("Failed to fetch settings")
      const data = await response.json()
      if (!data.success) throw new Error(data.error || "Failed to fetch settings")
      
      setSettings({
        persistent: data.data?.persistent || {},
        transient: data.data?.transient || {},
        defaults: data.data?.defaults || {}
      })
    } catch (error) {
      toast({
        title: "获取集群设置失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [clusterId])

  const formatSettingKey = (key: string) => {
    return key.split('.').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ')
  }

  const renderSettingValue = (value: any) => {
    if (value === null || value === undefined) return '-'
    
    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? '是' : '否'}
        </Badge>
      )
    }
    
    if (typeof value === 'number') {
      return <span className="font-mono">{value.toLocaleString()}</span>
    }
    
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return (
          <div className="flex flex-wrap gap-1">
            {value.map((item, index) => (
              <Badge key={index} variant="outline" className="font-mono">
                {String(item)}
              </Badge>
            ))}
          </div>
        )
      }
      
      return (
        <div className="space-y-2 pl-4 border-l-2 border-muted">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="space-y-1">
              <div className="text-xs text-muted-foreground">{formatSettingKey(k)}</div>
              <div>{renderSettingValue(v)}</div>
            </div>
          ))}
        </div>
      )
    }
    
    if (typeof value === 'string' && /^\d+[kmgtb]?b$/i.test(value)) {
      return <span className="font-mono">{formatBytes(value)}</span>
    }
    
    if (typeof value === 'string' && /^\d+[smhd]$/i.test(value)) {
      return <span className="font-mono">{formatDuration(value)}</span>
    }

    return <span className="font-mono">{String(value)}</span>
  }

  const formatBytes = (value: string) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const number = parseInt(value.replace(/[^0-9]/g, ''))
    const unit = value.slice(-2).toUpperCase()
    const unitIndex = units.indexOf(unit)
    if (unitIndex === -1) return value
    
    return `${number} ${units[unitIndex]}`
  }

  const formatDuration = (value: string) => {
    const number = parseInt(value.replace(/[^0-9]/g, ''))
    const unit = value.slice(-1).toLowerCase()
    const units: Record<string, string> = {
      's': '秒',
      'm': '分钟',
      'h': '小时',
      'd': '天'
    }
    return `${number} ${units[unit] || unit}`
  }

  const filterSettings = (settings: Record<string, any>) => {
    if (!searchTerm) return settings
    const lowerSearchTerm = searchTerm.toLowerCase()
    return Object.entries(settings).reduce((filtered, [key, value]) => {
      if (key.toLowerCase().includes(lowerSearchTerm) || 
          String(value).toLowerCase().includes(lowerSearchTerm)) {
        filtered[key] = value
      }
      return filtered
    }, {} as Record<string, any>)
  }

  const renderSettingsSection = (
    title: string, 
    description: string, 
    settings: Record<string, any> | null,
    variant: "default" | "secondary" | "outline" = "default"
  ) => {
    const filteredSettings = settings ? filterSettings(settings) : {}
    const settingsCount = Object.keys(filteredSettings).length
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <Badge variant={variant} className="h-6">
              {settingsCount} 项
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] rounded-md border">
            {settingsCount === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                没有找到匹配的设置项
              </div>
            ) : (
              <div className="space-y-4 p-4">
                {Object.entries(filteredSettings).map(([key, value]) => (
                  <div key={key} className="group space-y-1.5 pb-3 border-b last:border-0 hover:bg-muted/50 rounded-md p-2 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">{formatSettingKey(key)}</div>
                      <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {key}
                      </div>
                    </div>
                    <div className="text-sm">
                      {renderSettingValue(value)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {Array(3).fill(0).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-[200px]" />
                  <Skeleton className="h-4 w-[300px]" />
                </div>
                <Skeleton className="h-5 w-[50px]" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">集群设置</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索设置..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 w-[200px]"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSettings}
            disabled={refreshing}
          >
            <RefreshCw className={cn(
              "h-4 w-4 mr-2",
              refreshing && "animate-spin"
            )} />
            刷新
          </Button>
        </div>
      </div>

      {renderSettingsSection(
        "持久设置",
        "这些设置在集群重启后仍然保持",
        settings?.persistent || null,
        "default"
      )}

      {renderSettingsSection(
        "临时设置",
        "这些设置在集群重启后会重置",
        settings?.transient || null,
        "secondary"
      )}

      {renderSettingsSection(
        "默认设置",
        "集群的默认配置项",
        settings?.defaults || null,
        "outline"
      )}
    </div>
  )
} 