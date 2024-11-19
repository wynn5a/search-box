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
        title: "Template saved",
        description: "Query template has been saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template",
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
        title: "Template deleted",
        description: "The template has been deleted successfully",
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
          <h3 className="text-lg font-medium">Query Templates</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveCurrentQuery}
            disabled={!currentQuery}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Current
          </Button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
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
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
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
              Default
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
                    No custom templates found
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
                    No default templates found
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
            <DialogTitle>Save Current Query as Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Template name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Template description"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "Custom" : category}
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
              Save Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the template "{templateToDelete?.name}"? This action cannot be undone.
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
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
