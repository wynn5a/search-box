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
import { PlusCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { eventBus } from "@/lib/events"

const clusterFormSchema = z.object({
  name: z.string().min(2, "集群名称至少2个字符"),
  url: z.string().url("请输入有效的URL地址"),
  username: z.string().optional(),
  password: z.string().optional(),
})

type ClusterFormValues = z.infer<typeof clusterFormSchema>

export function AddClusterDialog() {
  const [open, setOpen] = useState(false)
  const [testing, setTesting] = useState(false)
  const { toast } = useToast()
  
  const form = useForm<ClusterFormValues>({
    resolver: zodResolver(clusterFormSchema),
    defaultValues: {
      name: "",
      url: "http://",
      username: "",
      password: "",
    },
  })

  async function testConnection(data: ClusterFormValues) {
    if (!form.getValues("url")) {
      toast({
        title: "请先填写集群地址",
        variant: "destructive",
      })
      return false
    }

    setTesting(true)
    try {
      const response = await fetch("/api/clusters/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: data.url,
          username: data.username || null,
          password: data.password || null,
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "连接成功",
          description: "可以正常连接到 OpenSearch 集群",
          variant: "default",
        })
      } else {
        toast({
          title: "连接失败",
          description: "无法连接到集群，请检查配置是否正确",
          variant: "destructive",
        })
      }
      
      return result.success
    } catch (error) {
      console.error("Error testing connection:", error)
      toast({
        title: "连接测试失败",
        description: "发生错误，请稍后重试",
        variant: "destructive",
      })
      return false
    } finally {
      setTesting(false)
    }
  }

  async function onSubmit(data: ClusterFormValues) {
    try {
      // 首先测试连接
      const isConnected = await testConnection(data)
      if (!isConnected) {
        return
      }

      const response = await fetch("/api/clusters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          username: data.username || null,
          password: data.password || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add cluster")
      }

      toast({
        title: "添加成功",
        description: "集群配置已成功添加",
      })

      setOpen(false)
      form.reset()
      // 触发事件而不是刷新页面
      eventBus.emit("clusterDefaultChanged")
    } catch (error) {
      console.error("Error adding cluster:", error)
      toast({
        title: "添加失败",
        description: "添加集群配置时发生错误",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <PlusCircle className="h-4 w-4" />
          添加集群
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>添加新集群</DialogTitle>
          <DialogDescription>
            添加一个新的 OpenSearch 集群连接配置。如果集群没有认证，可以不填用户名和密码。
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>集群名称</FormLabel>
                  <FormControl>
                    <Input placeholder="生产环境集群" {...field} />
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>用户名（可选）</FormLabel>
                  <FormControl>
                    <Input placeholder="admin" {...field} />
                  </FormControl>
                  <FormDescription>
                    如果集群启用了认证，请输入用户名
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>密码（可选）</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormDescription>
                    如果集群启用了认证，请输入密码
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => testConnection(form.getValues())}
                disabled={testing}
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    测试中...
                  </>
                ) : (
                  "测试连接"
                )}
              </Button>
              <Button type="submit">添加集群</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 