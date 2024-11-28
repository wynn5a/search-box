"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"
import { useTranslations } from "next-intl"

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
  const [settings, setSettings] = useState<IndexSettings | null>(null)
  const [localSettings, setLocalSettings] = useState<IndexSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const t = useTranslations("index")

  const fetchSettings = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/clusters/${clusterId}/indices/${indexName}/settings`)
      const data = await response.json()
      if (!data.success) {
        toast({
          title: t("settings.messages.fetch_failed"),
          description: t("settings.messages.try_again"),
          variant: "destructive",
        })
        return
      }
      const indexSettings = data.data?.settings?.index || {}
      const defaultSettings = data.data?.defaults?.index||{}
      const settings = {
        number_of_replicas: indexSettings.number_of_replicas? parseInt(indexSettings.number_of_replicas): 0,
        refresh_interval: defaultSettings.refresh_interval? defaultSettings.refresh_interval: '1s',
        max_result_window: defaultSettings.max_result_window? parseInt(defaultSettings.max_result_window): 0,
        blocks: {
          read_only: indexSettings.blocks?.read_only === 'true',
          read_only_allow_delete: indexSettings.blocks?.read_only_allow_delete === 'true',
          read: indexSettings.blocks?.read === 'true',
          write: indexSettings.blocks?.write === 'true'
        }
      }

      setSettings(settings)
      setLocalSettings(settings)
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast({
        title: t("settings.messages.fetch_failed"),
        description: error instanceof Error ? error.message : t("settings.messages.try_again"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [clusterId, indexName])

  const handleInputChange = (key: keyof IndexSettings, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const saveBasicSettings = async () => {
    if (!localSettings) return

    try {
      setSaving(true)
      const response = await fetch(`/api/clusters/${clusterId}/indices/${indexName}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          index: {
            number_of_replicas: localSettings.number_of_replicas,
            refresh_interval: localSettings.refresh_interval,
            max_result_window: localSettings.max_result_window,
          }
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t("settings.messages.update_failed"))
      }

      // 只有成功时才更新settings
      setSettings(prev => ({
        ...prev,
        number_of_replicas: localSettings.number_of_replicas,
        refresh_interval: localSettings.refresh_interval,
        max_result_window: localSettings.max_result_window,
      }))

      toast({
        title: t("settings.messages.update_success"),
        description: t("settings.messages.update_basic_success"),
      })
    } catch (error) {
      // 更新失败时恢复本地状态
      setLocalSettings(prev => ({ ...settings }))

      console.error("Error updating settings:", error)
      toast({
        title: t("settings.messages.update_failed"),
        description: error instanceof Error ? error.message : t("settings.messages.try_again"),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const updateBlockSettings = async (newBlocks: Partial<IndexSettings['blocks']>) => {
    const originalSettings = { ...settings }
    const originalLocalSettings = { ...localSettings }

    try {
      setSaving(true)
      // 先乐观更新UI
      const updatedBlocks = {
        ...settings?.blocks,
        ...newBlocks
      }

      setSettings(prev => ({
        ...prev,
        blocks: updatedBlocks
      }))

      setLocalSettings(prev => ({
        ...prev,
        blocks: updatedBlocks
      }))

      const response = await fetch(`/api/clusters/${clusterId}/indices/${indexName}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          index: {
            blocks: newBlocks
          }
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t("settings.messages.update_failed"))
      }

      toast({
        title: t("settings.messages.update_success"),
        description: t("settings.messages.update_access_success"),
      })
    } catch (error) {
      // 更新失败时恢复到原始状态
      setSettings(originalSettings)
      setLocalSettings(originalLocalSettings)

      console.error("Error updating block settings:", error)
      toast({
        title: t("settings.messages.update_failed"),
        description: error instanceof Error ? error.message : t("settings.messages.try_again"),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-9 w-[100px]" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
      {/* 基本设置 */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-2 justify-between">
            <div className="flex justify-left space-x-2">
              <h4 className="text-lg font-medium">{t("settings.labels.basic")}</h4>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-[300px] text-sm">{t("settings.descriptions.basic")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={saveBasicSettings}
                disabled={saving}
                loading={saving}
                variant={"outline"}
              >
                <Save className="h-4 w-4 mr-2" />
                {t("settings.actions.save")}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="replicas">{t("settings.labels.replicas")}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-[300px] text-sm">{t("settings.descriptions.number_of_replicas")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="replicas"
                type="number"
                min="0"
                value={localSettings?.number_of_replicas ?? 0}
                onChange={(e) => handleInputChange('number_of_replicas', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="refresh">{t("settings.labels.refresh")}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-[300px] text-sm">{t("settings.descriptions.refresh_interval")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="refresh"
                value={localSettings?.refresh_interval ?? "1s"}
                onChange={(e) => handleInputChange('refresh_interval', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="window">{t("settings.labels.window")}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-[300px] text-sm">{t("settings.descriptions.max_result_window")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="window"
                type="number"
                min="1"
                value={localSettings?.max_result_window ?? 10000}
                onChange={(e) => handleInputChange('max_result_window', parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 访问控制 */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-medium">{t("settings.labels.access")}</h4>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[300px] text-sm">{t("settings.descriptions.blocks.read_only")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("settings.labels.read_only")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("settings.descriptions.blocks.read_only")}
                </p>
              </div>
              <Switch
                checked={settings?.blocks?.read_only ?? false}
                onCheckedChange={(checked) => updateBlockSettings({ read_only: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("settings.labels.read_only_delete")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("settings.descriptions.blocks.read_only_allow_delete")}
                </p>
              </div>
              <Switch
                checked={settings?.blocks?.read_only_allow_delete ?? false}
                onCheckedChange={(checked) => updateBlockSettings({ read_only_allow_delete: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("settings.labels.read")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("settings.descriptions.blocks.read")}
                </p>
              </div>
              <Switch
                checked={settings?.blocks?.read ?? false}
                onCheckedChange={(checked) => updateBlockSettings({ read: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("settings.labels.write")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("settings.descriptions.blocks.write")}
                </p>
              </div>
              <Switch
                checked={settings?.blocks?.write ?? false}
                onCheckedChange={(checked) => updateBlockSettings({ write: checked })}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}