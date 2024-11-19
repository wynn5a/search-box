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
import { RefreshCw, Save, Plus, Trash, Edit, Code } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

const FIELD_TYPES = [
  { value: 'text', label: '文本' },
  { value: 'keyword', label: '关键字' },
  { value: 'long', label: '长整数' },
  { value: 'integer', label: '整数' },
  { value: 'short', label: '短整数' },
  { value: 'byte', label: '字节' },
  { value: 'double', label: '双精度' },
  { value: 'float', label: '单精度' },
  { value: 'boolean', label: '布尔值' },
  { value: 'date', label: '日期' },
  { value: 'object', label: '对象' },
  { value: 'nested', label: '嵌套' },
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingField, setEditingField] = useState<FieldConfig | null>(null)
  const [showJson, setShowJson] = useState(false)
  const { toast } = useToast()
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null)

  const fetchMappings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/clusters/${clusterId}/indices/${indexName}/mappings`)
      if (!response.ok) throw new Error("Failed to fetch mappings")
      const data = await response.json()
      if (!data.success) throw new Error(data.error || "Failed to fetch mappings")
      
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
    } catch (error) {
      toast({
        title: "获取索引映射失败",
        description: error instanceof Error ? error.message : "请稍后重试",
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

      if (!response.ok) throw new Error("Failed to update mappings")
      const data = await response.json()
      if (!data.success) throw new Error(data.error || "Failed to update mappings")

      toast({
        title: "映射已更新",
        description: "索引映射已成功更新",
      })

      await fetchMappings()
    } catch (error) {
      toast({
        title: "更新映射失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const deleteField = async (fieldName: string) => {
    try {
      // 更新字段列表
      setFields(fields.filter((f: FieldConfig) => f.name !== fieldName))
      toast({
        title: "字段已删除",
        description: "请记得保存更改以应用到索引",
      })
    } catch (error) {
      toast({
        title: "删除字段失败",
        description: error instanceof Error ? error.message : "请稍后重试",
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
        <div className="flex justify-between">
          <Skeleton className="h-10 w-[200px]" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-10 w-[100px]" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">索引映射</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowJson(!showJson)}
          >
            <Code className="h-4 w-4 mr-2" />
            {showJson ? "表格视图" : "JSON 视图"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMappings}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
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
            添加字段
          </Button>
          <Button
            size="sm"
            onClick={saveMappings}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            保存
          </Button>
        </div>
      </div>

      {showJson ? (
        <Card>
          <CardContent className="p-4">
            <ScrollArea className="h-[400px]">
              <pre className="text-sm">
                {JSON.stringify(convertToOpenSearchMapping(fields), null, 2)}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>字段名</TableHead>
                  <TableHead>字段类型</TableHead>
                  <TableHead>是否索引</TableHead>
                  <TableHead>是否存储</TableHead>
                  <TableHead>分词器</TableHead>
                  <TableHead>其他设置</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      没有字段配置
                    </TableCell>
                  </TableRow>
                ) : (
                  fields.map((field: FieldConfig) => (
                    <TableRow key={field.name}>
                      <TableCell>{field.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {FIELD_TYPES.find(t => t.value === field.type)?.label || field.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={field.index ? "default" : "secondary"}>
                          {field.index ? "是" : "否"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={field.store ? "default" : "secondary"}>
                          {field.store ? "是" : "否"}
                        </Badge>
                      </TableCell>
                      <TableCell>{field.analyzer || "-"}</TableCell>
                      <TableCell>
                        {field.format ? `format: ${field.format}` : ""}
                        {field.fields ? "multi-fields" : ""}
                        {field.properties ? "properties" : ""}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingField(field)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFieldToDelete(field.name)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editingField} onOpenChange={(open) => !open && setEditingField(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingField?.name ? "编辑字段" : "添加字段"}</DialogTitle>
            <DialogDescription>
              配置字段的类型和属性
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">字段名</Label>
              <Input
                className="col-span-3"
                value={editingField?.name || ''}
                onChange={(e) => setEditingField(prev => ({ ...prev!, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">字段类型</Label>
              <Select
                value={editingField?.type}
                onValueChange={(value) => setEditingField(prev => ({ ...prev!, type: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">是否索引</Label>
              <Switch
                checked={editingField?.index}
                onCheckedChange={(checked) => setEditingField(prev => ({ ...prev!, index: checked }))}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">是否存储</Label>
              <Switch
                checked={editingField?.store}
                onCheckedChange={(checked) => setEditingField(prev => ({ ...prev!, store: checked }))}
              />
            </div>
            {editingField?.type === 'text' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">分词器</Label>
                <Select
                  value={editingField?.analyzer}
                  onValueChange={(value) => setEditingField(prev => ({ ...prev!, analyzer: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANALYZERS.map(analyzer => (
                      <SelectItem key={analyzer} value={analyzer}>
                        {analyzer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {editingField?.type === 'date' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">日期格式</Label>
                <Input
                  className="col-span-3"
                  value={editingField?.format || ''}
                  onChange={(e) => setEditingField(prev => ({ ...prev!, format: e.target.value }))}
                  placeholder="yyyy-MM-dd HH:mm:ss"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingField(null)}>
              取消
            </Button>
            <Button onClick={() => {
              if (editingField) {
                const isEditing = fields.some((f: FieldConfig) => f.name === editingField.name)
                if (isEditing) {
                  setFields(fields.map((f: FieldConfig) => 
                    f.name === editingField.name ? editingField : f
                  ))
                } else {
                  setFields([...fields, editingField])
                }
                setEditingField(null)
              }
            }}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!fieldToDelete} onOpenChange={(open) => !open && setFieldToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除字段</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                <div>
                  删除字段 "{fieldToDelete}" 可能会导致数据不一致。建议按照以下步骤操作：
                </div>
                <ol className="list-decimal list-inside space-y-1">
                  <li>先迁移或删除包含此字段的文档</li>
                  <li>重建索引以应用新的映射</li>
                </ol>
                <div className="text-destructive">
                  确定要继续删除此字段吗？
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFieldToDelete(null)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => fieldToDelete && deleteField(fieldToDelete)}
            >
              删除字段
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 