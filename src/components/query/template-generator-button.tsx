"use client"

import { Button } from "@/components/ui/button"
import { useCallback, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { generateDocumentTemplate, generateBulkTemplate } from "@/lib/template-generator"
import { OpenSearchClient } from "@/lib/opensearch"
import { Loader } from "lucide-react"

interface TemplateGeneratorButtonProps {
  client: OpenSearchClient
  index: string
  isBulk?: boolean
  onGenerated: (template: string) => void
  className?: string
}

export function TemplateGeneratorButton({
  client,
  index,
  isBulk = false,
  onGenerated,
  className
}: TemplateGeneratorButtonProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    try {
      setLoading(true)
      const template = isBulk
        ? await generateBulkTemplate(client, index)
        : await generateDocumentTemplate(client, index)
      onGenerated(template)
      toast({
        title: "Success",
        description: `Successfully generated ${isBulk ? "bulk" : "document"} template`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error generating template:", error)
      toast({
        title: "Error",
        description: `Failed to generate ${isBulk ? "bulk" : "document"} template`,
        variant: "destructive",
      })
    }finally {
      setLoading(false)
    }
  }, [client, index, isBulk, onGenerated, toast])

  return (
    <Button 
      variant="outline" 
      disabled={loading}
      onClick={handleClick}
      className={className}
    >
      {loading && <Loader className="mr-1 animate-spin" />}
      {loading ? "生成中..." : `生成${isBulk ? "批量" : ""}模板`}
    </Button>
  )
}
