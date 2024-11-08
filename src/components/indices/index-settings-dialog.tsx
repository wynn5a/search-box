"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Loader2, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

const settingsFormSchema = z.object({
  number_of_replicas: z.string()
    .transform(Number)
    .pipe(z.number().min(0, "副本数量不能小于0")),
  refresh_interval: z.string()
    .regex(/^\d+[smh]?$/, "格式无效，例如：1s, 30s, 1m"),
  max_result_window: z.string()
    .transform(Number)
    .pipe(z.number().min(1, "结果窗口大小至少为1")),
})

type SettingsFormValues = z.infer<typeof settingsFormSchema>

interface IndexSettingsDialogProps {
  clusterId: string
  indexName: string
  onSuccess?: () => void
}

export function IndexSettingsDialog({ clusterId, indexName, onSuccess }: IndexSettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<any>(null)
  const [mappings, setMappings] = useState<any>(null)
  const { toast } = useToast()
  
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      number_of_replicas: 1,
      refresh_interval: "1s",
      max_result_window: 10000,
    },
  })

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/clusters/${clusterId}/indices/${indexName}`)
      if (!response.ok) throw new Error("Failed to fetch index settings")
      const data = await response.json()
      setSettings(data.settings)
      setMappings(data.mappings)
      
      // 更新表单默认值
      const indexSettings = data.settings[indexName].settings.index
      form.reset({
        number_of_replicas: indexSettings.number_of_replicas || "1",
        refresh_interval: indexSettings.refresh_interval || "1s",
        max_result_window: indexSettings.max_result_window || "10000",
      })
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast({
        title: "获取索引设置失败",
        description: "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const onOpenChange = (open: boolean) => {
    if (open) {
      fetchSettings()
    }
    setOpen(open)
  }

  async function onSubmit(data: SettingsFormValues) {
    try {
      setLoading(true)
      const response = await fetch(`/api/clusters/${clusterId}/indices/${indexName}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          index: {
            number_of_replicas: data.number_of_replicas,
            refresh_interval: data.refresh_interval,
            max_result_window: data.max_result_window,
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to update settings")

      toast({
        title: "设置已更新",
        description: "索引设置已成功更新",
      })

      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error updating settings:", error)
      toast({
        title: "更新设置失败",
        description: "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>索引设置 - {indexName}</DialogTitle>
          <DialogDescription>
            查看和修改索引的设置与映射
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="settings">
          <TabsList>
            <TabsTrigger value="settings">基本设置</TabsTrigger>
            <TabsTrigger value="mappings">映射</TabsTrigger>
            <TabsTrigger value="advanced">高级设置</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="number_of_replicas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>副本数量</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormDescription>
                        每个主分片的副本数量
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="refresh_interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>刷新间隔</FormLabel>
                      <FormControl>
                        <Input placeholder="1s" {...field} />
                      </FormControl>
                      <FormDescription>
                        索引刷新间隔，例如：1s, 30s, 1m
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="max_result_window"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>最大结果窗口</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormDescription>
                        from + size 的最大值
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      "保存设置"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="mappings" className="space-y-4">
            {mappings && (
              <pre className="rounded-lg bg-muted p-4 overflow-auto max-h-[400px]">
                <code>{JSON.stringify(mappings[indexName], null, 2)}</code>
              </pre>
            )}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            {settings && (
              <pre className="rounded-lg bg-muted p-4 overflow-auto max-h-[400px]">
                <code>{JSON.stringify(settings[indexName], null, 2)}</code>
              </pre>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 