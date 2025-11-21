import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { getFriendlyErrorMessage } from '@/lib/utils/error-utils'
import { useLocale } from 'next-intl'

interface QueryExecutionOptions {
  onSuccess?: () => Promise<void>
}

export function useQueryExecution(clusterId: string, options: QueryExecutionOptions = {}) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [executionTime, setExecutionTime] = useState<number | null>(null)
  const { toast } = useToast()
  const locale = useLocale()

  const resetResults = () => {
    setResults(null)
    setExecutionTime(null)
  }

  const executeQuery = async (method: string, path: string, body?: any) => {
    const startTime = performance.now()

    try {
      setLoading(true)

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

      const data = await response.json()
      setExecutionTime(performance.now() - startTime)

      if (!response.ok) {
        setResults({ error: data.error || "查询失败" })
        const errorMessage = getFriendlyErrorMessage(data, locale)
        toast({
          title: locale === 'zh' ? "查询失败" : "Query Failed",
          description: errorMessage,
          variant: "destructive",
        })
        return false
      }

      setResults(data)

      // 如果是创建索引操作，执行成功回调
      if (method === "PUT" && path.startsWith("/") && !path.includes("_")) {
        if (options.onSuccess) {
          await options.onSuccess()
        }
        toast({
          title: locale === 'zh' ? "创建成功" : "Created Successfully",
          description: locale === 'zh' ? "索引创建成功，已更新索引列表" : "Index created successfully, index list updated",
        })
      }

      return true
    } catch (error) {
      const errorMessage = getFriendlyErrorMessage(error, locale)
      toast({
        title: locale === 'zh' ? "错误" : "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    results,
    executionTime,
    executeQuery,
    resetResults
  }
}
