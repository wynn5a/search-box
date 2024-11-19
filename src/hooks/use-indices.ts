import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface Index {
  index: string
}

export function useIndices(clusterId: string) {
  const [indices, setIndices] = useState<Index[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchIndices = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/clusters/${clusterId}/indices`)
      if (!response.ok) throw new Error("Failed to fetch indices")
      const { success, data } = await response.json()
      if (success && Array.isArray(data)) {
        setIndices(data.map(index => ({ index: index.index || index })))
      }
    } catch (error) {
      console.error("Error fetching indices:", error)
      toast({
        title: "错误",
        description: "加载索引列表失败",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIndices()
  }, [clusterId])

  return {
    indices,
    loading,
    refresh: fetchIndices
  }
}
