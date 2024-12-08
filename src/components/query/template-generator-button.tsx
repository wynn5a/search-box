"use client"

import { Button } from "@/components/ui/button"
import { useCallback, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { generateDocumentTemplate, generateBulkTemplate } from "@/lib/template-generator"
import { OpenSearchClient } from "@/lib/opensearch"
import { Loader } from "lucide-react"
import { useTranslations } from "next-intl"

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
  const t = useTranslations()

  const handleClick = useCallback(async () => {
    try {
      setLoading(true)
      const template = isBulk
        ? await generateBulkTemplate(client, index)
        : await generateDocumentTemplate(client, index)
      onGenerated(template)
      toast({
        title: t("clusters.query.workspace.template.generated"),
        description: t("clusters.query.workspace.template.generate_success", {
          type: isBulk ? t("clusters.query.workspace.template.bulk") : t("clusters.query.workspace.template.document")
        }),
        variant: "default",
      })
    } catch (error) {
      toast({
        title: t("common.error.unknown"),
        description: error instanceof Error 
          ? error.message 
          : t("clusters.query.workspace.template.generate_error", {
              type: isBulk ? t("clusters.query.workspace.template.bulk") : t("clusters.query.workspace.template.document")
            }),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [client, index, isBulk, onGenerated, toast, t])

  return (
    <Button 
      variant="outline" 
      disabled={loading}
      onClick={handleClick}
      className={className}
    >
      {loading && <Loader className="mr-1 animate-spin" />}
      {loading 
        ? t("clusters.query.workspace.template.generating")
        : t("clusters.query.workspace.template.generate", {
            type: isBulk ? t("clusters.query.workspace.template.bulk") : t("clusters.query.workspace.template.document")
          })
      }
    </Button>
  )
}
