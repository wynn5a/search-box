import { ClusterBreadcrumb } from "@/components/cluster/cluster-breadcrumb"
import { QueryWorkspace } from "@/components/query/query-workspace"

export default function QueryPage({ params }: { params: { clusterId: string } }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <ClusterBreadcrumb clusterId={params.clusterId} currentPage="数据查询" />
        </div>
      </div>
      <div className="flex-1 border-t">
        <QueryWorkspace clusterId={params.clusterId} />
      </div>
    </div>
  )
} 