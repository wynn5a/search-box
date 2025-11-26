"use client"

import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { Moon, Sun, Database, Search, Home, Plus } from "lucide-react"
import { useParams } from "next/navigation"
import { Link, usePathname, useRouter } from "@/routing"
import { LanguageToggle } from "@/components/language-toggle"
import { UserMenu } from "@/components/auth/user-menu"
import { ClusterSelector } from "@/components/layout/cluster-selector"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { AddClusterDialog } from "@/components/cluster/add-cluster-dialog"
import { useState } from "react"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { setTheme, theme } = useTheme()
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations("nav")
  const [showAddDialog, setShowAddDialog] = useState(false)
  
  const clusterId = params?.clusterId as string | undefined
  const hasClusterSelected = !!clusterId

  // Determine active menu
  const isIndicesActive = pathname?.includes("/indices")
  const isQueryActive = pathname?.includes("/query")
  const isOverviewActive = clusterId && !isIndicesActive && !isQueryActive

  return (
    <div className="h-full flex flex-col">
      <header className="flex-none border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          {/* Left side: Logo + Cluster Selector + Navigation */}
          <div className="flex items-center gap-4">
            <Link className="flex items-center space-x-2" href="/">
              <span className="font-bold text-lg">Search Box</span>
            </Link>
            
            <div className="h-6 w-px bg-border" />
            
            <ClusterSelector />
            
            {/* Dynamic Navigation - only show when a cluster is selected */}
            {hasClusterSelected && (
              <>
                <div className="h-6 w-px bg-border" />
                <nav className="flex items-center gap-1">
                  <Link href={`/clusters/${clusterId}`}>
                    <Button
                      variant={isOverviewActive ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "gap-2",
                        isOverviewActive && "bg-secondary"
                      )}
                    >
                      <Home className="h-4 w-4" />
                      {t("overview")}
                    </Button>
                  </Link>
                  <Link href={`/clusters/${clusterId}/indices`}>
                    <Button
                      variant={isIndicesActive ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "gap-2",
                        isIndicesActive && "bg-secondary"
                      )}
                    >
                      <Database className="h-4 w-4" />
                      {t("indices")}
                    </Button>
                  </Link>
                  <Link href={`/clusters/${clusterId}/query`}>
                    <Button
                      variant={isQueryActive ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "gap-2",
                        isQueryActive && "bg-secondary"
                      )}
                    >
                      <Search className="h-4 w-4" />
                      {t("query")}
                    </Button>
                  </Link>
                </nav>
              </>
            )}
          </div>
          
          {/* Right side: Actions + User Menu */}
          <div className="flex flex-1 items-center justify-end gap-2">
            {!hasClusterSelected && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-4 w-4" />
                {t("addCluster")}
              </Button>
            )}
            <UserMenu />
            <LanguageToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">{t("toggleTheme")}</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 container overflow-hidden">
        {children}
      </main>
      
      <AddClusterDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          setShowAddDialog(false)
          router.refresh()
        }}
      />
    </div>
  )
}
