"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Trash2, Search, ExternalLink } from "lucide-react"
import { defaultTemplates, type QueryTemplate } from "@/config/default-templates"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useTranslations } from "next-intl"

interface QueryTemplateManagerProps {
  customTemplates: QueryTemplate[]
  currentQuery?: {
    method: string
    path: string
    body: string
  }
  onSaveTemplate: (template: Omit<QueryTemplate, "id">) => Promise<void>
  onDeleteTemplate: (templateId: string) => Promise<void>
  onSelectTemplate: (template: QueryTemplate) => void
}

export function QueryTemplateManager({
  customTemplates,
  currentQuery,
  onSaveTemplate,
  onDeleteTemplate,
  onSelectTemplate,
}: QueryTemplateManagerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isOpen, setIsOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<QueryTemplate | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const { toast } = useToast()
  const t = useTranslations()

  const categories = ["all", ...Array.from(new Set([
    ...defaultTemplates.map((t) => t.category),
    ...customTemplates.map((t) => t.category)
  ]))].sort();

  const filterTemplates = (templates: QueryTemplate[]) => {
    return templates.filter((template) => {
      const matchesSearch =
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }

  const filteredDefaultTemplates = filterTemplates(defaultTemplates)
  const filteredCustomTemplates = filterTemplates(customTemplates)

  const handleSaveCurrentQuery = () => {
    if (!currentQuery) return
    setName("")
    setDescription("")
    setIsOpen(true)
  }

  const handleSaveTemplate = async () => {
    if (!currentQuery) return
    try {
      await onSaveTemplate({
        name,
        description,
        category: selectedCategory === "all" ? "custom" : selectedCategory,
        method: currentQuery.method,
        path: currentQuery.path,
        body: currentQuery.body,
        tags: [],
      })
      setIsOpen(false)
      setName("")
      setDescription("")
      toast({
        title: t('clusters.query.template_manager.save.success_title'),
        description: t('clusters.query.template_manager.save.success_description'),
      })
    } catch (error) {
      toast({
        title: t('clusters.query.template_manager.save.error_title'),
        description: error instanceof Error ? error.message : t('clusters.query.template_manager.save.error_description'),
        variant: "destructive",
      })
    }
  }

  const handleSelectTemplate = (template: QueryTemplate) => {
    onSelectTemplate(template);
  };

  const handleDeleteConfirm = async () => {
    if (templateToDelete) {
      await onDeleteTemplate(templateToDelete.id)
      setTemplateToDelete(null)
      setDeleteDialogOpen(false)
      toast({
        title: t('clusters.query.template_manager.delete.success.title'),
        description: t('clusters.query.template_manager.delete.success.description'),
      })
    }
  }

  const renderTemplateCard = (template: QueryTemplate, isCustom: boolean = false) => (
    <Card 
      key={template.id} 
      className="group hover:bg-accent cursor-pointer transition-colors"
      onClick={() => handleSelectTemplate(template)}
    >
      <CardHeader className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">
                {template.name}
              </CardTitle>
              {template.docUrl && !isCustom && (
                <Link 
                  href={template.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}
            </div>
            <CardDescription className="text-sm">{template.description}</CardDescription>
          </div>
          {isCustom && (
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/90 hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                setTemplateToDelete(template);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <Badge variant="secondary" className="text-xs">
            {template.method}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {template.category}
          </Badge>
        </div>
      </CardHeader>
    </Card>
  )

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 space-y-4 p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">{t('clusters.query.title')}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveCurrentQuery}
            disabled={!currentQuery}
          >
            <Save className="h-4 w-4 mr-2" />
            {t('clusters.query.template_manager.save.button')}
          </Button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('clusters.query.template_manager.search.placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('clusters.query.template_manager.category.all')} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "all" 
                    ? t('clusters.query.template_manager.category.all')
                    : category === "custom"
                    ? t('clusters.query.template_manager.category.custom')
                    : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="default" className="flex-1 flex flex-col min-h-0">
        <div className="px-4">
          <TabsList className="w-full">
            <TabsTrigger value="custom" className="flex-1">
              Custom
              <Badge variant="secondary" className="ml-2">
                {filteredCustomTemplates.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="default" className="flex-1">
              {t('clusters.query.template_manager.tabs.default')}
              <Badge variant="secondary" className="ml-2">
                {filteredDefaultTemplates.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 min-h-0">
          <TabsContent value="custom" className="h-full m-0 p-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {filteredCustomTemplates.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    {t('clusters.query.template_manager.empty.custom')}
                  </div>
                ) : (
                  filteredCustomTemplates.map((template) => renderTemplateCard(template, true))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="default" className="h-full m-0 p-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {filteredDefaultTemplates.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    {t('clusters.query.template_manager.empty.default')}
                  </div>
                ) : (
                  filteredDefaultTemplates.map((template) => renderTemplateCard(template))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('clusters.query.template_manager.save.title')}</DialogTitle>
            <DialogDescription>
              {t('clusters.query.template_manager.save.description.text')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('clusters.query.template_manager.save.name.label')}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('clusters.query.template_manager.save.name.placeholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('clusters.query.template_manager.save.template_description.label')}</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('clusters.query.template_manager.save.template_description.placeholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('clusters.query.template_manager.save.category.label')}</Label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('clusters.query.template_manager.category.all')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" 
                        ? t('clusters.query.template_manager.category.custom')
                        : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={handleSaveTemplate}
              disabled={!name || !description}
            >
              {t('clusters.query.template_manager.save.submit')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('clusters.query.template_manager.delete.title')}</DialogTitle>
            <DialogDescription>
              {t('clusters.query.template_manager.delete.description.text')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTemplateToDelete(null);
                setDeleteDialogOpen(false);
              }}
            >
              {t('clusters.query.template_manager.delete.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              {t('clusters.query.template_manager.delete.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
