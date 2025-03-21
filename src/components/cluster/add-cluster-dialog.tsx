"use client"

import { useState, useEffect } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Network } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { eventBus, EVENTS } from "@/lib/events"

const clusterFormSchema = z.object({
  name: z.string().min(2, "集群名称至少2个字符"),
  url: z.string().url("请输入有效的URL地址"),
  username: z.string().default(""),
  password: z.string().default(""),
  sshEnabled: z.boolean().default(false),
  sshHost: z.string().default(""),
  sshPort: z.coerce.number().default(22),
  sshUser: z.string().default(""),
  sshPassword: z.string().default(""),
  sshKeyFile: z.string().default(""),
}).refine((data) => {
  if (data.sshEnabled) {
    return !!(data.sshHost && data.sshUser && (data.sshPassword || data.sshKeyFile))
  }
  return true
}, {
  message: "启用SSH隧道时，必须填写主机地址、用户名和认证信息",
})

type ClusterFormValues = z.infer<typeof clusterFormSchema>

interface AddClusterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function AddClusterDialog({ 
  open, 
  onOpenChange,
  onSuccess,
  trigger 
}: AddClusterDialogProps) {
  const [testingTunnel, setTestingTunnel] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  
  const form = useForm<ClusterFormValues>({
    resolver: zodResolver(clusterFormSchema),
    defaultValues: {
      name: "",
      url: "http://",
      username: "",
      password: "",
      sshEnabled: false,
      sshHost: "",
      sshPort: 22,
      sshUser: "",
      sshPassword: "",
      sshKeyFile: "",
    },
  })

  const sshEnabled = form.watch("sshEnabled")

  useEffect(() => {
    if (!sshEnabled) {
      form.setValue("sshHost", "")
      form.setValue("sshUser", "")
      form.setValue("sshPassword", "")
      form.setValue("sshKeyFile", "")
      form.setValue("sshPort", 22)
    }
  }, [sshEnabled, form])

  async function testTunnel() {
    if (!form.getValues("sshHost") || !form.getValues("sshUser")) {
      toast({
        title: "请填写必要信息",
        description: "SSH主机地址和用户名是必需的",
        variant: "destructive",
      })
      return
    }

    setTestingTunnel(true)
    try {
      const response = await fetch("/api/clusters/test-tunnel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sshHost: form.getValues("sshHost"),
          sshPort: form.getValues("sshPort"),
          sshUser: form.getValues("sshUser"),
          sshPassword: form.getValues("sshPassword"),
          sshKeyFile: form.getValues("sshKeyFile"),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'SSH tunnel test failed')
      }

      toast({
        title: "SSH隧道测试成功",
        description: "可以正常建立SSH连接",
      })
    } catch (error) {
      console.error("SSH tunnel test error:", error)
      toast({
        title: "SSH隧道测试失败",
        description: error instanceof Error ? error.message : "无法建立SSH连接",
        variant: "destructive",
      })
    } finally {
      setTestingTunnel(false)
    }
  }

  const onSubmit = async (values: z.infer<typeof clusterFormSchema>) => {
    try {
      setSubmitting(true)
      const response = await fetch("/api/clusters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add cluster")
      }

      toast({
        title: "集群添加成功",
        description: "新的集群已成功添加",
      })

      // 触发集群添加事件
      eventBus.emit(EVENTS.CLUSTER_ADDED)
      
      form.reset()
      onSuccess?.()
    } catch (error) {
      toast({
        title: "添加集群失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>添加新集群</DialogTitle>
          <DialogDescription>
            添加一个新的 OpenSearch 集群连接配置
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Basic Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>集群名称</FormLabel>
                    <FormControl>
                      <Input placeholder="Cluster name" {...field} />
                    </FormControl>
                    <FormDescription>
                      用于标识不同的集群
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>集群地址</FormLabel>
                    <FormControl>
                      <Input placeholder="http://localhost:9200" {...field} />
                    </FormControl>
                    <FormDescription>
                      OpenSearch 集群的访问地址
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field: { value, ...field } }) => (
                  <FormItem>
                    <FormLabel>用户名（可选）</FormLabel>
                    <FormControl>
                      <Input placeholder="用户名" value={value || ""} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field: { value, ...field } }) => (
                  <FormItem>
                    <FormLabel>密码（可选）</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="密码" value={value || ""} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* SSH Tunnel Configuration */}
            <div className="pt-4 border-t">
              <FormField
                control={form.control}
                name="sshEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        启用 SSH 隧道
                      </FormLabel>
                      <FormDescription>
                        通过 SSH 隧道连接到集群
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              {sshEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="sshHost"
                    render={({ field: { value, ...field } }) => (
                      <FormItem>
                        <FormLabel>SSH 主机地址</FormLabel>
                        <FormControl>
                          <Input placeholder="example.com" value={value || ""} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sshPort"
                    render={({ field: { value, ...field } }) => (
                      <FormItem>
                        <FormLabel>SSH 端口</FormLabel>
                        <FormControl>
                          <Input type="number" value={value || ""} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sshUser"
                    render={({ field: { value, ...field } }) => (
                      <FormItem>
                        <FormLabel>SSH 用户名</FormLabel>
                        <FormControl>
                          <Input value={value || ""} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sshPassword"
                    render={({ field: { value, ...field } }) => (
                      <FormItem>
                        <FormLabel>SSH 密码</FormLabel>
                        <FormControl>
                          <Input type="password" value={value || ""} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="col-span-1 md:col-span-2">
                    <FormField
                      control={form.control}
                      name="sshKeyFile"
                      render={({ field: { value, ...field } }) => (
                        <FormItem>
                          <FormLabel>SSH 私钥（可选）</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="-----BEGIN RSA PRIVATE KEY-----"
                              value={value || ""}
                              {...field}
                              rows={4}
                            />
                          </FormControl>
                          <FormDescription>
                            如果使用密钥认证，请粘贴私钥内容
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={testTunnel}
                      disabled={testingTunnel}
                    >
                      {testingTunnel ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          测试中...
                        </>
                      ) : (
                        <>
                          <Network className="mr-2 h-4 w-4" />
                          测试隧道连接
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    添加中...
                  </>
                ) : (
                  "添加集群"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}