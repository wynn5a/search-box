"use client"

import { useState, useEffect, useMemo } from "react"
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
import { useTranslations } from "next-intl"

// Define the shape of the form values for type safety
const baseSchema = z.object({
  name: z.string(),
  url: z.string(),
  username: z.string(),
  password: z.string(),
  sshEnabled: z.boolean(),
  sshHost: z.string(),
  sshPort: z.coerce.number(),
  sshUser: z.string(),
  sshPassword: z.string(),
  sshKeyFile: z.string(),
})

type ClusterFormValues = z.infer<typeof baseSchema>

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
  const t = useTranslations('cluster.add')
  const tCommon = useTranslations('common')
  const tList = useTranslations('clusters.list')

  const clusterFormSchema = useMemo(() => z.object({
    name: z.string().min(2, t('validation.name')),
    url: z.string().url(t('validation.url')),
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
    message: t('validation.ssh'),
    path: ["sshHost"], // Attach error to a field to make it visible
  }), [t])

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
        title: t('validation.missing_info'),
        description: t('validation.ssh'),
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
        title: tList('testing.success.title'),
        description: tList('testing.success.description'),
      })
    } catch (error) {
      console.error("SSH tunnel test error:", error)
      toast({
        title: tList('testing.error.title'),
        description: error instanceof Error ? error.message : tList('testing.error.description'),
        variant: "destructive",
      })
    } finally {
      setTestingTunnel(false)
    }
  }

  // Map API error messages to translation keys
  const getErrorMessage = (apiError: string): string => {
    // Check for common error patterns
    if (apiError.includes('Unable to connect') || apiError.includes('connect')) {
      return t('error.connection')
    }
    if (apiError.includes('Unauthorized')) {
      return t('error.unauthorized')
    }
    if (apiError.includes('Validation failed')) {
      return t('error.validation_failed')
    }
    if (apiError.includes('Failed to add cluster')) {
      return t('error.unknown')
    }
    // Return the API error as fallback
    return apiError
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
        title: t('success.title'),
        description: t('success.description'),
      })

      // Trigger cluster added event
      eventBus.emit(EVENTS.CLUSTER_ADDED)

      form.reset()
      onSuccess?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('error.description')
      toast({
        title: t('error.title'),
        description: getErrorMessage(errorMessage),
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
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
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
                    <FormLabel>{t('form.name.label')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('form.name.placeholder')} {...field} />
                    </FormControl>
                    <FormDescription>
                      {t('form.name.description')}
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
                    <FormLabel>{t('form.url.label')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('form.url.placeholder')} {...field} />
                    </FormControl>
                    <FormDescription>
                      {t('form.url.description')}
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
                    <FormLabel>{t('form.auth.username.label')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('form.auth.username.placeholder')} value={value || ""} {...field} />
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
                    <FormLabel>{t('form.auth.password.label')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t('form.auth.password.placeholder')} value={value || ""} {...field} />
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
                        {t('form.ssh.enabled')}
                      </FormLabel>
                      <FormDescription>
                        {t('form.ssh.title')}
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
                        <FormLabel>{t('form.ssh.host.label')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('form.ssh.host.placeholder')} value={value || ""} {...field} />
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
                        <FormLabel>{t('form.ssh.port.label')}</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder={t('form.ssh.port.placeholder')} value={value || ""} {...field} />
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
                        <FormLabel>{t('form.ssh.user.label')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('form.ssh.user.placeholder')} value={value || ""} {...field} />
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
                        <FormLabel>{t('form.ssh.password.label')}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder={t('form.ssh.password.placeholder')} value={value || ""} {...field} />
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
                          <FormLabel>{t('form.ssh.keyFile.label')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('form.ssh.keyFile.placeholder')}
                              value={value || ""}
                              {...field}
                              rows={4}
                            />
                          </FormControl>
                          <FormDescription>
                            {t('form.ssh.keyFile.description')}
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
                          {tList('testing.in_progress')}
                        </>
                      ) : (
                        <>
                          <Network className="mr-2 h-4 w-4" />
                          {tCommon('button.test')}
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
                    {t('button')}...
                  </>
                ) : (
                  t('button')
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}