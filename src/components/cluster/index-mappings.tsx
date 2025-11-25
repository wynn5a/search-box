"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Save, Plus, Trash, Edit, Code, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTranslations } from "next-intl"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const FIELD_TYPES = [
  { value: 'text', label: 'text' },
  { value: 'keyword', label: 'keyword' },
  { value: 'long', label: 'long' },
  { value: 'integer', label: 'integer' },
  { value: 'short', label: 'short' },
  { value: 'byte', label: 'byte' },
  { value: 'double', label: 'double' },
  { value: 'float', label: 'float' },
  { value: 'boolean', label: 'boolean' },
  { value: 'date', label: 'date' },
  { value: 'object', label: 'object' },
  { value: 'nested', label: 'nested' },
]

const ANALYZERS = [
  'standard',
  'simple',
  'whitespace',
  'stop',
  'keyword',
  'pattern',
  'language',
  'ik_max_word',
  'ik_smart'
]

interface FieldConfig {
  name: string
  type: string
  index?: boolean
  store?: boolean
  analyzer?: string
  search_analyzer?: string
  format?: string
  fields?: Record<string, any>
  properties?: Record<string, FieldConfig>
}

interface IndexMappingsProps {
  clusterId: string
  indexName: string
}

export function IndexMappings({ clusterId, indexName }: IndexMappingsProps) {
  const [fields, setFields] = useState<FieldConfig[]>([])
  const [originalFieldNames, setOriginalFieldNames] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingField, setEditingField] = useState<FieldConfig | null>(null)
  const [showJson, setShowJson] = useState(false)
  const { toast } = useToast()
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null)
  const t = useTranslations("index")

  const fetchMappings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/clusters/${clusterId}/indices/${indexName}/mappings`)
      if (!response.ok) throw new Error(t("mappings.messages.fetch_failed"))
      const data = await response.json()
      if (!data.success) throw new Error(data.error || t("mappings.messages.fetch_failed"))

      console.log(data.data)

      // 从响应中提取字段配置
      const mappings = data.data.properties || {}
      const processedFields = Object.entries(mappings).map(([name, config]: [string, any]) => ({
        name,
        type: config.type,
        index: config.index !== false,
        store: config.store === true,
        analyzer: config.analyzer,
        search_analyzer: config.search_analyzer,
        format: config.format,
        fields: config.fields,
        properties: config.properties,
      }))

      setFields(processedFields)
      setOriginalFieldNames(new Set(processedFields.map((f: FieldConfig) => f.name)))
    } catch (error) {
      toast({
        title: t("mappings.messages.fetch_failed"),
        description: error instanceof Error ? error.message : t("settings.messages.try_again"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveMappings = async () => {
    try {
      setSaving(true)
      // 将字段配置转换为 OpenSearch 映射格式
      const properties = fields.reduce((acc: Record<string, any>, field) => {
        acc[field.name] = {
          type: field.type,
          ...(field.index === false && { index: false }),
          ...(field.store === true && { store: true }),
          ...(field.analyzer && { analyzer: field.analyzer }),
          ...(field.search_analyzer && { search_analyzer: field.search_analyzer }),
          ...(field.format && { format: field.format }),
          ...(field.fields && { fields: field.fields }),
          ...(field.properties && { properties: field.properties }),
        }
        return acc
      }, {})

      const response = await fetch(`/api/clusters/${clusterId}/indices/${indexName}/mappings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ properties }),
      })

      if (!response.ok) throw new Error(t("mappings.messages.update_failed"))
      const data = await response.json()
      if (!data.success) throw new Error(data.error || t("mappings.messages.update_failed"))

      toast({
        title: t("mappings.messages.save_success"),
        description: t("mappings.messages.save_description"),
      })

      await fetchMappings()
    } catch (error) {
      toast({
        title: t("mappings.messages.update_failed"),
        description: error instanceof Error ? error.message : t("settings.messages.try_again"),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const deleteField = async (fieldName: string) => {
    if (originalFieldNames.has(fieldName)) {
      toast({
        title: t("mappings.messages.delete_failed"),
        description: "Cannot delete existing fields. Reindexing is required.",
        variant: "destructive",
      })
      return
    }

    try {
      // 更新字段列表
      setFields(fields.filter((f: FieldConfig) => f.name !== fieldName))
      toast({
        title: t("mappings.messages.delete_success"),
        description: t("mappings.messages.delete_description"),
      })
    } catch (error) {
      toast({
        title: t("mappings.messages.delete_failed"),
        description: error instanceof Error ? error.message : t("settings.messages.try_again"),
        variant: "destructive",
      })
    } finally {
      setFieldToDelete(null)
    }
  }

  useEffect(() => {
    fetchMappings()
  }, [clusterId, indexName])

  const convertToOpenSearchMapping = (fields: FieldConfig[]) => {
    const properties = fields.reduce((acc: Record<string, any>, field) => {
      acc[field.name] = {
        type: field.type,
        ...(field.index === false && { index: false }),
        ...(field.store === true && { store: true }),
        ...(field.analyzer && { analyzer: field.analyzer }),
        ...(field.search_analyzer && { search_analyzer: field.search_analyzer }),
        ...(field.format && { format: field.format }),
        ...(field.fields && { fields: field.fields }),
        ...(field.properties && { properties: field.properties }),
      }
      return acc
    }, {})

    return {
      mappings: {
        properties
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-9 w-[100px]" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{t("mappings.labels.title")}</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowJson(!showJson)}
          >
            <Code className="h-4 w-4 mr-2" />
            {showJson ? t("mappings.actions.view_table") : t("mappings.actions.view_json")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMappings}
            disabled={loading}
            loading={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("settings.actions.refresh")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingField({
              name: '',
              type: 'text',
              index: true,
              store: false,
            })}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("mappings.actions.add")}
          </Button>
          <Button
            variant={"outline"}
            size="sm"
            onClick={saveMappings}
            disabled={saving}
            loading={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {t("mappings.actions.save")}
          </Button>
        </div>
      </div>

      {showJson ? (
        <Card>
          <CardContent className="p-4">
            <ScrollArea className="h-[300px]">
              <pre className="text-sm">
                {JSON.stringify(convertToOpenSearchMapping(fields), null, 2)}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("mappings.labels.name")}</TableHead>
                    <TableHead>{t("mappings.labels.type")}</TableHead>
                    <TableHead className="w-[100px]">{t("mappings.labels.index")}</TableHead>
                    <TableHead className="w-[100px]">{t("mappings.labels.store")}</TableHead>
                    <TableHead>{t("mappings.labels.analyzer")}</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        {t("mappings.messages.no_mappings")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    fields.map((field: FieldConfig) => {
                      const isExisting = originalFieldNames.has(field.name)
                      return (
                        <TableRow key={field.name}>
                          <TableCell>{field.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {t(`mappings.field_types.${field.type}`)}
                            </Badge>
                          </TableCell>
                          <TableCell>{field.index !== false ? "✓" : "✗"}</TableCell>
                          <TableCell>{field.store === true ? "✓" : "✗"}</TableCell>
                          <TableCell>{field.analyzer || "-"}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingField(field)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {isExisting ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span tabIndex={0}>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled
                                        className="opacity-50 cursor-not-allowed"
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Cannot delete existing fields</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setFieldToDelete(field.name)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editingField} onOpenChange={() => setEditingField(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingField?.name ? t("mappings.dialogs.edit.title") : t("mappings.dialogs.add.title")}
            </DialogTitle>
            <DialogDescription>
              {editingField?.name ? t("mappings.dialogs.edit.description") : t("mappings.dialogs.add.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("mappings.labels.name")}</Label>
              <Input
                id="name"
                value={editingField?.name || ""}
                onChange={(e) =>
                  setEditingField((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                disabled={!!(editingField && originalFieldNames.has(editingField.name))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">{t("mappings.labels.type")}</Label>
              <Select
                value={editingField?.type || "text"}
                onValueChange={(value) =>
                  setEditingField((prev) =>
                    prev ? { ...prev, type: value } : null
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {t(`mappings.field_types.${type.value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("mappings.labels.index")}</Label>
              <Switch
                checked={editingField?.index !== false}
                onCheckedChange={(checked) =>
                  setEditingField((prev) =>
                    prev ? { ...prev, index: checked } : null
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("mappings.labels.store")}</Label>
              <Switch
                checked={editingField?.store === true}
                onCheckedChange={(checked) =>
                  setEditingField((prev) =>
                    prev ? { ...prev, store: checked } : null
                  )
                }
              />
            </div>
            {editingField?.type === 'text' && (
              <div className="space-y-2">
                <Label>{t("mappings.labels.analyzer")}</Label>
                <Select
                  value={editingField?.analyzer || ""}
                  onValueChange={(value) =>
                    setEditingField((prev) =>
                      prev ? { ...prev, analyzer: value } : null
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分析器" />
                  </SelectTrigger>
                  <SelectContent>
                    {ANALYZERS.map((analyzer) => (
                      <SelectItem key={analyzer} value={analyzer}>
                        {analyzer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {editingField?.type === 'date' && (
              <div className="space-y-2">
                <Label>{t("mappings.labels.format")}</Label>
                <Input
                  value={editingField?.format || ""}
                  onChange={(e) =>
                    setEditingField((prev) =>
                      prev ? { ...prev, format: e.target.value } : null
                    )
                  }
                  placeholder="yyyy-MM-dd HH:mm:ss"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingField(null)}>
              {t("mappings.actions.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (editingField) {
                  const existingIndex = fields.findIndex(
                    (f) => f.name === editingField.name
                  )
                  if (existingIndex >= 0) {
                    setFields((prev) => {
                      const newFields = [...prev]
                      newFields[existingIndex] = editingField
                      return newFields
                    })
                  } else {
                    setFields((prev) => [...prev, editingField])
                  }
                  setEditingField(null)
                }
              }}
            >
              {t("mappings.actions.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!fieldToDelete} onOpenChange={() => setFieldToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("mappings.dialogs.delete.title")}</DialogTitle>
            <DialogDescription>
              {t("mappings.dialogs.delete.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFieldToDelete(null)}>
              {t("mappings.actions.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => fieldToDelete && deleteField(fieldToDelete)}
            >
              {t("mappings.dialogs.delete.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 