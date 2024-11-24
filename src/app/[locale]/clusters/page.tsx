import { ClustersList } from "@/components/cluster/clusters-list"
import { AddClusterButton } from "@/components/cluster/add-cluster-button"
import { Separator } from "@/components/ui/separator"
import { Database } from "lucide-react"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function ClustersPage() {
  return (
    <div className="flex flex-col space-y-6">
      <div className="px-6 pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Database className="h-6 w-6 text-muted-foreground" />
              <h1 className="text-3xl font-bold tracking-tight">集群管理</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              管理和监控您的 OpenSearch 集群，查看集群状态和性能指标
            </p>
          </div>
          <AddClusterButton />
        </div>
        <Separator className="my-6" />
      </div>
      <div className="px-6">
        <ClustersList />
      </div>
    </div>
  )
} 