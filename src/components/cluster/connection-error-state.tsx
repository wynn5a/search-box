"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CloudOff, RefreshCw, Settings, WifiOff } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

interface ConnectionErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  retrying?: boolean
  variant?: "card" | "inline" | "full"
  showSettings?: boolean
  settingsHref?: string
  className?: string
}

export function ConnectionErrorState({
  title,
  description,
  onRetry,
  retrying = false,
  variant = "card",
  showSettings = false,
  settingsHref,
  className,
}: ConnectionErrorStateProps) {
  const t = useTranslations("common.connection_error")
  
  const displayTitle = title || t("title")
  const displayDescription = description || t("description")

  if (variant === "inline") {
    return (
      <div className={cn(
        "flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800",
        className
      )}>
        <div className="flex-shrink-0">
          <WifiOff className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            {displayTitle}
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-0.5">
            {displayDescription}
          </p>
        </div>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            disabled={retrying}
            className="flex-shrink-0 text-amber-700 hover:text-amber-800 hover:bg-amber-100 dark:text-amber-300 dark:hover:text-amber-200 dark:hover:bg-amber-900/50"
          >
            <RefreshCw className={cn("h-4 w-4", retrying && "animate-spin")} />
          </Button>
        )}
      </div>
    )
  }

  if (variant === "full") {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center py-16 px-4",
        className
      )}>
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-amber-200 dark:bg-amber-800/30 rounded-full blur-xl opacity-60" />
          <div className="relative p-4 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50">
            <CloudOff className="h-12 w-12 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {displayTitle}
        </h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          {displayDescription}
        </p>
        <div className="flex items-center gap-3">
          {onRetry && (
            <Button
              variant="outline"
              onClick={onRetry}
              disabled={retrying}
              className="border-amber-300 hover:border-amber-400 hover:bg-amber-50 dark:border-amber-700 dark:hover:border-amber-600 dark:hover:bg-amber-950/50"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", retrying && "animate-spin")} />
              {t("retry")}
            </Button>
          )}
          {showSettings && settingsHref && (
            <Button variant="ghost" asChild>
              <a href={settingsHref}>
                <Settings className="h-4 w-4 mr-2" />
                {t("check_settings")}
              </a>
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-6 text-center max-w-sm">
          {t("hint")}
        </p>
      </div>
    )
  }

  // Default: card variant
  return (
    <Card className={cn(
      "border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10",
      className
    )}>
      <CardContent className="flex flex-col items-center justify-center py-10 px-6">
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-amber-200 dark:bg-amber-800/30 rounded-full blur-lg opacity-50" />
          <div className="relative p-3 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50">
            <CloudOff className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        <h4 className="text-lg font-semibold text-foreground mb-1">
          {displayTitle}
        </h4>
        <p className="text-sm text-muted-foreground text-center mb-4 max-w-xs">
          {displayDescription}
        </p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={retrying}
            className="border-amber-300 hover:border-amber-400 hover:bg-amber-50 dark:border-amber-700 dark:hover:border-amber-600 dark:hover:bg-amber-950/50"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", retrying && "animate-spin")} />
            {t("retry")}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Grid-compatible error state for dashboard cards
export function ConnectionErrorGrid({
  onRetry,
  retrying = false,
  columns = 4,
}: {
  onRetry?: () => void
  retrying?: boolean
  columns?: number
}) {
  const t = useTranslations("common.connection_error")
  
  return (
    <div className={cn(
      "grid gap-4",
      columns === 4 && "md:grid-cols-2 lg:grid-cols-4",
      columns === 3 && "md:grid-cols-2 lg:grid-cols-3",
      columns === 2 && "md:grid-cols-2"
    )}>
      {Array(columns).fill(0).map((_, i) => (
        <Card 
          key={i} 
          className={cn(
            "border-amber-200/50 dark:border-amber-800/50",
            i === 0 && "bg-gradient-to-br from-amber-50/80 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20"
          )}
        >
          <CardContent className="p-6">
            {i === 0 ? (
              <div className="flex flex-col items-center justify-center py-2">
                <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50 mb-3">
                  <WifiOff className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                  {t("title")}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 text-center mb-3">
                  {t("short_description")}
                </p>
                {onRetry && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRetry}
                    disabled={retrying}
                    className="text-amber-700 hover:text-amber-800 hover:bg-amber-100 dark:text-amber-300 dark:hover:text-amber-200 dark:hover:bg-amber-900/50"
                  >
                    <RefreshCw className={cn("h-3 w-3 mr-1.5", retrying && "animate-spin")} />
                    {t("retry")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3 opacity-40">
                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

