"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { useRouter, usePathname } from "@/routing"
import { Check, ChevronsUpDown, Database, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useTranslations } from "next-intl"
import { eventBus, EVENTS } from "@/lib/events"

interface Cluster {
  id: string
  name: string
  url: string
  health?: {
    status: string
  }
}

export function ClusterSelector() {
  const t = useTranslations("nav")
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const [open, setOpen] = useState(false)
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [loading, setLoading] = useState(true)
  
  const currentClusterId = params?.clusterId as string | undefined

  const fetchClusters = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/clusters/overview")
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setClusters(data.data.map((cluster: any) => ({
            id: cluster.id,
            name: cluster.name,
            url: cluster.url,
            health: cluster.health
          })))
        }
      }
    } catch (error) {
      console.error("Failed to fetch clusters:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchClusters()
  }, [fetchClusters])

  // Refresh when dropdown is opened
  useEffect(() => {
    if (open) {
      fetchClusters()
    }
  }, [open, fetchClusters])

  // Listen to cluster events
  useEffect(() => {
    const handleClusterChange = () => {
      fetchClusters()
    }

    eventBus.on(EVENTS.CLUSTER_ADDED, handleClusterChange)
    eventBus.on(EVENTS.CLUSTER_UPDATED, handleClusterChange)
    eventBus.on(EVENTS.CLUSTER_DELETED, handleClusterChange)

    return () => {
      eventBus.off(EVENTS.CLUSTER_ADDED, handleClusterChange)
      eventBus.off(EVENTS.CLUSTER_UPDATED, handleClusterChange)
      eventBus.off(EVENTS.CLUSTER_DELETED, handleClusterChange)
    }
  }, [fetchClusters])

  const selectedCluster = clusters.find((cluster) => cluster.id === currentClusterId)

  const handleSelect = (clusterId: string | null) => {
    setOpen(false)
    if (clusterId === null) {
      // Navigate to cluster manager (all clusters view)
      router.push("/clusters")
    } else {
      // Navigate to cluster detail page
      router.push(`/clusters/${clusterId}`)
    }
  }

  const getHealthColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "green":
        return "bg-green-500"
      case "yellow":
        return "bg-yellow-500"
      case "red":
        return "bg-red-500"
      default:
        return "bg-gray-400"
    }
  }

  // Determine if we're viewing "all" clusters (cluster manager page or home)
  const isAllClusters = !currentClusterId || pathname === "/" || pathname.endsWith("/clusters")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[220px] justify-between"
        >
          {loading && clusters.length === 0 ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("loading")}
            </span>
          ) : isAllClusters ? (
            <span className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              {t("allClusters")}
            </span>
          ) : selectedCluster ? (
            <span className="flex items-center gap-2 truncate">
              <span className={cn("h-2 w-2 rounded-full", getHealthColor(selectedCluster.health?.status))} />
              <span className="truncate">{selectedCluster.name}</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              {t("selectCluster")}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0">
        <Command>
          <CommandInput placeholder={t("searchCluster")} />
          <CommandList>
            <CommandEmpty>{t("noClusterFound")}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => handleSelect(null)}
                className="cursor-pointer"
              >
                <Database className="mr-2 h-4 w-4" />
                <span>{t("allClusters")}</span>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    isAllClusters ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            </CommandGroup>
            {clusters.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={t("clusters")}>
                  {clusters.map((cluster) => (
                    <CommandItem
                      key={cluster.id}
                      value={cluster.name}
                      onSelect={() => handleSelect(cluster.id)}
                      className="cursor-pointer"
                    >
                      <span className={cn(
                        "mr-2 h-2 w-2 rounded-full",
                        getHealthColor(cluster.health?.status)
                      )} />
                      <span className="truncate flex-1">{cluster.name}</span>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          currentClusterId === cluster.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
