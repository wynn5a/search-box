"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ClusterConfig } from "@/types/cluster"
import { Database, Settings, Search } from "lucide-react"

interface ClusterCardProps {
  cluster: ClusterConfig & {
    health?: {
      status: string
      number_of_nodes: number
    }
    stats?: {
      indices: {
        count: number
        docs: {
          count: number
        }
      }
    }
  }
}

export function ClusterCard({ cluster }: ClusterCardProps) {
  const router = useRouter()

  const getStatusDotColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "green":
        return "bg-green-500"
      case "yellow":
        return "bg-yellow-500"
      case "red":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card 
      className="hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={() => router.push(`/clusters/${cluster.id}`)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${getStatusDotColor(cluster.health?.status)}`} />
            <CardTitle className="text-lg font-medium">
              {cluster.name}
            </CardTitle>
          </div>
          <CardDescription>{cluster.url}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">节点数</p>
              <p className="text-lg font-bold">{cluster.health?.number_of_nodes || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">索引数</p>
              <p className="text-lg font-bold">{cluster.stats?.indices.count || 0}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/clusters/${cluster.id}`)
              }}
            >
              <Settings className="mr-2 h-4 w-4" />
              管理
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/clusters/${cluster.id}/indices`)
              }}
            >
              <Database className="mr-2 h-4 w-4" />
              索引
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/clusters/${cluster.id}/query`)
              }}
            >
              <Search className="mr-2 h-4 w-4" />
              查询
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 