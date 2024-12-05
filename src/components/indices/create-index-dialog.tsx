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
import { useTranslations } from "next-intl"

const createIndexFormSchema = (t: any) => z.object({
  name: z.string()
    .min(1, t('clusters.list.indices.create_index.validation.name_required'))
    .regex(/^[a-z0-9-_]+$/, t('clusters.list.indices.create_index.validation.name_format')),
  shards: z.coerce.number().min(1, t('clusters.list.indices.create_index.validation.shards_min')),
  replicas: z.coerce.number().min(0, t('clusters.list.indices.create_index.validation.replicas_min')),
})

type IndexFormValues = z.infer<ReturnType<typeof createIndexFormSchema>>

interface CreateIndexDialogProps {
  clusterId: string
  onCreated?: () => Promise<void>
}

export function CreateIndexDialog({ clusterId, onCreated }: CreateIndexDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const t = useTranslations()
  
  const form = useForm<IndexFormValues>({
    resolver: zodResolver(createIndexFormSchema(t)),
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
        throw new Error(result.message || t('clusters.list.indices.create_index.toast.error_description'))
      }

      toast({
        title: t('clusters.list.indices.create_index.toast.success_title'),
        description: t('clusters.list.indices.create_index.toast.success_description', { name: data.name }),
      })

      setOpen(false)
      form.reset()
      if (onCreated) {
        await onCreated()
      }
    } catch (error) {
      console.error("Error creating index:", error)
      toast({
        title: t('clusters.list.indices.create_index.toast.error_title'),
        description: error instanceof Error ? error.message : t('clusters.list.indices.create_index.toast.error_description'),
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
          {t('clusters.list.indices.create_index.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('clusters.list.indices.create_index.title')}</DialogTitle>
          <DialogDescription>
            {t('clusters.list.indices.create_index.description')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('clusters.list.indices.create_index.name.label')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('clusters.list.indices.create_index.name.placeholder')} {...field} />
                  </FormControl>
                  <FormDescription>
                    {t('clusters.list.indices.create_index.name.description')}
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
                  <FormLabel>{t('clusters.list.indices.create_index.shards.label')}</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormDescription>
                    {t('clusters.list.indices.create_index.shards.description')}
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
                  <FormLabel>{t('clusters.list.indices.create_index.replicas.label')}</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormDescription>
                    {t('clusters.list.indices.create_index.replicas.description')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? t('clusters.list.indices.create_index.creating') : t('clusters.list.indices.create_index.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}