"use client"

import { useCallback, useMemo } from "react"
import { OpenSearchClient } from "@/lib/opensearch"

export function useOpenSearchClient(clusterId: string) {
  const executeQuery = useCallback(async ({ method, path, body }: { method: string; path: string; body?: any }) => {
    const response = await fetch(`/api/clusters/${clusterId}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        method,
        path,
        body,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Query failed")
    }

    return response.json()
  }, [clusterId])

  const client = useMemo(() => {
    return {
      executeQuery,
    } as OpenSearchClient
  }, [executeQuery])

  return client
}
