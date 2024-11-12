import { ClusterBreadcrumb } from "@/components/cluster/cluster-breadcrumb"
import { QueryWorkspaceWrapper } from "@/components/query/query-workspace-wrapper"

export default async function QueryPage(props: { params: Promise<{ clusterId: string }> }) {
  const params = await props.params;
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-6 p-6">
        <ClusterBreadcrumb clusterId={params.clusterId} currentPage="数据查询" />
      </div>
      <div className="flex-1 border-t">
        <QueryWorkspaceWrapper clusterId={params.clusterId} />
      </div>
    </div>
  )
} 