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
import { PlusCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const indexFormSchema = z.object({
  name: z.string()
    .min(1, "索引名称不能为空")
    .regex(/^[a-z0-9-_]+$/, "索引名称只能包含小写字母、数字、横线和下划线"),
  shards: z.coerce.number().min(1, "主分片数量至少为1"),
  replicas: z.coerce.number().min(0, "副本分片数量不能小于0"),
})

type IndexFormValues = z.infer<typeof indexFormSchema>

interface CreateIndexDialogProps {
  clusterId: string
  onCreated?: () => Promise<void>
}

export function CreateIndexDialog({ clusterId, onCreated }: CreateIndexDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  
  const form = useForm<IndexFormValues>({
    resolver: zodResolver(indexFormSchema),
    defaultValues: {
      name: "",
      shards: 1,
      replicas: 0,
    },
  })

  const onSubmit = async (data: IndexFormValues) => {
    if (loading) return

    try {
      setLoading(true)
      const response = await fetch(`/api/clusters/${clusterId}/indices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          settings: {
            "number_of_shards": data.shards,
            "number_of_replicas": data.replicas,
            "refresh_interval": "1s",
            "max_result_window": 10000,
          },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "创建索引失败")
      }

      toast({
        title: "索引已创建",
        description: `索引 "${data.name}" 已成功创建`,
      })

      setOpen(false)
      form.reset()
      if (onCreated) {
        await onCreated()
      }
    } catch (error) {
      console.error("Error creating index:", error)
      toast({
        title: "创建索引失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!loading) {
        setOpen(open)
        if (!open) {
          form.reset()
        }
      }
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2" variant={"outline"}>
          <PlusCircle className="h-4 w-4" />
          创建索引
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>创建新索引</DialogTitle>
          <DialogDescription>
            创建一个新的索引并配置其基本设置
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>索引名称</FormLabel>
                  <FormControl>
                    <Input placeholder="my-index" {...field} />
                  </FormControl>
                  <FormDescription>
                    索引名称必须是小写，可以包含数字、横线和下划线
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shards"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>主分片数量</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormDescription>
                    主分片数量在创建后不能修改，单节点建议设置为1
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="replicas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>副本分片数量</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormDescription>
                    副本分片数量可以随时调整，单节点建议设置为0
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={loading} loading={loading}>
                {loading ? "创建中..." : "创建索引"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 