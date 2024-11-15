"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RefreshCw, Save, Code } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"

interface IndexSettingsProps {
  clusterId: string
  indexName: string
}

interface IndexSettings {
  number_of_replicas?: number
  refresh_interval?: string
  max_result_window?: number
  blocks?: {
    read_only?: boolean
    read_only_allow_delete?: boolean
    read?: boolean
    write?: boolean
  }
}

const SETTINGS_DESCRIPTIONS = {
  number_of_replicas: "每个主分片的副本数量。增加副本数可以提高可用性和读取性能，但会占用更多存储空间。",
  refresh_interval: "索引的刷新间隔，决定了新写入的数据多久可以被搜索到。较短的间隔会增加实时性但可能影响写入性能。",
  max_result_window: "from + size 的最大值，用于分页查询。增大此值可能会占用更多内存。",
  blocks: {
    read_only: "设置索引为只读模式，禁止写入和元数据修改。",
    read_only_allow_delete: "设置索引为只读模式，但允许删除操作。通常在磁盘空间不足时自动启用。",
    read: "禁止对索引的读取操作。",
    write: "禁止对索引的写入操作，但允许元数据修改。"
  }
}

export function IndexSettings({ clusterId, indexName }: IndexSettingsProps) {
  const [settings, setSettings] = useState<IndexSettings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showJson, setShowJson] = useState(false)
  const { toast } = useToast()

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/clusters/${clusterId}/indices/${indexName}/settings`)
      if (!response.ok) throw new Error("Failed to fetch settings")
      const data = await response.json()
      if (!data.success) throw new Error(data.error || "Failed to fetch settings")
      
      // 提取需要的设置项
      const indexSettings = data.data?.index || {}
      setSettings({
        number_of_replicas: parseInt(indexSettings.number_of_replicas),
        refresh_interval: indexSettings.refresh_interval,
        max_result_window: parseInt(indexSettings.max_result_window),
        blocks: {
          read_only: indexSettings.blocks?.read_only === 'true',
          read_only_allow_delete: indexSettings.blocks?.read_only_allow_delete === 'true',
          read: indexSettings.blocks?.read === 'true',
          write: indexSettings.blocks?.write === 'true',
        }
      })
    } catch (error) {
      toast({
        title: "获取索引设置失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/clusters/${clusterId}/indices/${indexName}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          index: {
            ...settings,
            blocks: Object.fromEntries(
              Object.entries(settings.blocks || {}).filter(([_, value]) => value !== undefined)
            )
          }
        }),
      })

      if (!response.ok) throw new Error("Failed to update settings")
      const data = await response.json()
      if (!data.success) throw new Error(data.error || "Failed to update settings")

      toast({
        title: "设置已更新",
        description: "索引设置已成功更新",
      })

      await fetchSettings()
    } catch (error) {
      toast({
        title: "更新设置失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [clusterId, indexName])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">索引设置</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowJson(!showJson)}
          >
            <Code className="h-4 w-4 mr-2" />
            {showJson ? "表单视图" : "JSON 视图"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSettings}
            disabled={loading}
          >
            <RefreshCw className={cn(
              "h-4 w-4 mr-2",
              loading && "animate-spin"
            )} />
            刷新
          </Button>
          <Button
            size="sm"
            onClick={saveSettings}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            保存
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          {showJson ? (
            <ScrollArea className="h-[400px]">
              <pre className="text-sm">
                {JSON.stringify({ index: settings }, null, 2)}
              </pre>
            </ScrollArea>
          ) : (
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList>
                <TabsTrigger value="basic">基本设置</TabsTrigger>
                <TabsTrigger value="blocks">访问控制</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="text-right flex items-center justify-end gap-2">
                      <Label>副本数量</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{SETTINGS_DESCRIPTIONS.number_of_replicas}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      className="col-span-3"
                      value={settings.number_of_replicas || 0}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        number_of_replicas: parseInt(e.target.value)
                      }))}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="text-right flex items-center justify-end gap-2">
                      <Label>刷新间隔</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{SETTINGS_DESCRIPTIONS.refresh_interval}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Select
                      value={settings.refresh_interval || '1s'}
                      onValueChange={(value) => setSettings(prev => ({
                        ...prev,
                        refresh_interval: value
                      }))}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1s">1 秒</SelectItem>
                        <SelectItem value="5s">5 秒</SelectItem>
                        <SelectItem value="10s">10 秒</SelectItem>
                        <SelectItem value="30s">30 秒</SelectItem>
                        <SelectItem value="1m">1 分钟</SelectItem>
                        <SelectItem value="-1">手动刷新</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="text-right flex items-center justify-end gap-2">
                      <Label>最大结果窗口</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{SETTINGS_DESCRIPTIONS.max_result_window}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      className="col-span-3"
                      value={settings.max_result_window || 10000}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        max_result_window: parseInt(e.target.value)
                      }))}
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="blocks" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="text-right flex items-center justify-end gap-2">
                      <Label>只读</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{SETTINGS_DESCRIPTIONS.blocks.read_only}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Switch
                      checked={settings.blocks?.read_only}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        blocks: { ...prev.blocks, read_only: checked }
                      }))}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="text-right flex items-center justify-end gap-2">
                      <Label>允许删除的只读</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{SETTINGS_DESCRIPTIONS.blocks.read_only_allow_delete}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Switch
                      checked={settings.blocks?.read_only_allow_delete}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        blocks: { ...prev.blocks, read_only_allow_delete: checked }
                      }))}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="text-right flex items-center justify-end gap-2">
                      <Label>禁止读取</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{SETTINGS_DESCRIPTIONS.blocks.read}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Switch
                      checked={settings.blocks?.read}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        blocks: { ...prev.blocks, read: checked }
                      }))}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="text-right flex items-center justify-end gap-2">
                      <Label>禁止写入</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{SETTINGS_DESCRIPTIONS.blocks.write}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Switch
                      checked={settings.blocks?.write}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        blocks: { ...prev.blocks, write: checked }
                      }))}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 