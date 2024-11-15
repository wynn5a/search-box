"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus } from "lucide-react"
import { Card } from "@/components/ui/card"

interface FieldTemplate {
  type: string
  [key: string]: any
}

interface FieldTemplatesDialogProps {
  onSelect: (template: FieldTemplate) => void
}

export function FieldTemplatesDialog({ onSelect }: FieldTemplatesDialogProps) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<Record<string, FieldTemplate>>({})

  const fetchTemplates = async () => {
    // 实现获取模板的逻辑
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          使用模板
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>选择字段模板</DialogTitle>
          <DialogDescription>
            选择一个预定义的字段模板来快速添加常用的字段配置
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(templates).map(([name, template]) => (
              <Card
                key={name}
                className="p-4 cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  onSelect(template)
                  setOpen(false)
                }}
              >
                <h4 className="font-medium">{name}</h4>
                <pre className="text-xs text-muted-foreground mt-2">
                  {JSON.stringify(template, null, 2)}
                </pre>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 