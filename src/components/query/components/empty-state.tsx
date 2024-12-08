import { SearchX } from "lucide-react"
import { useTranslations } from "next-intl"

export function EmptyState() {
  const t = useTranslations()
  
  return (
    <div className="h-full border rounded-md relative flex flex-col items-center justify-center text-muted-foreground">
      <SearchX className="h-12 w-12 mb-4 opacity-50" />
      <p className="text-lg font-medium mb-1">{t("clusters.query.results.empty.title")}</p>
      <p className="text-sm">{t("clusters.query.results.empty.description")}</p>
    </div>
  )
}
