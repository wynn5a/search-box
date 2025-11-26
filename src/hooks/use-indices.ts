import { useState, useEffect, useCallback } from 'react'

export interface Index {
  index: string
}

export function useIndices(clusterId: string) {
  const [indices, setIndices] = useState<Index[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)

  const fetchIndices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/clusters/${clusterId}/indices`)
      if (!response.ok) throw new Error("Failed to fetch indices")
      const { success, data } = await response.json()
      if (success && Array.isArray(data)) {
        setIndices(data.map(index => ({ index: index.index || index })))
      }
    } catch (err) {
      console.error("Error fetching indices:", err)
      setError(err instanceof Error ? err.message : "Failed to load indices")
    } finally {
      setLoading(false)
      setRetrying(false)
    }
  }, [clusterId])

  const retry = useCallback(() => {
    setRetrying(true)
    fetchIndices()
  }, [fetchIndices])

  useEffect(() => {
    fetchIndices()
  }, [fetchIndices])

  return {
    indices,
    loading,
    error,
    retrying,
    refresh: fetchIndices,
    retry
  }
}
