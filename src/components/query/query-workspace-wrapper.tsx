"use client"

import { useEffect, useState } from "react"
import { QueryWorkspace } from "./query-workspace"

export function QueryWorkspaceWrapper({ clusterId }: { clusterId: string }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  return <QueryWorkspace clusterId={clusterId} />
} 