"use client"

import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter } from "@/routing"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"

const LOCALE_LABELS = {
  en: {
    flag: "🇺🇸",
    label: "English",
    full: "English (US)"
  },
  zh: {
    flag: "🇨🇳",
    label: "中文",
    full: "简体中文"
  },
} as const

export function LanguageToggle() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [currentLocale, setCurrentLocale] = useState(locale)

  useEffect(() => {
    setCurrentLocale(locale)
  }, [locale])

  const handleLocaleChange = async (newLocale: string) => {
    setCurrentLocale(newLocale)
    await router.replace(pathname, { locale: newLocale })
  }

  const localeInfo = LOCALE_LABELS[currentLocale as keyof typeof LOCALE_LABELS]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="w-auto px-3 gap-2">
          <span className="text-base leading-none">{localeInfo.flag}</span>
          <span className="hidden md:inline-block">
            {localeInfo.label}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {Object.entries(LOCALE_LABELS).map(([key, value]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => handleLocaleChange(key)}
            className={cn(
              "gap-2 justify-start",
              currentLocale === key && "bg-accent"
            )}
          >
            <span className="text-base leading-none">{value.flag}</span>
            <span>{value.full}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
