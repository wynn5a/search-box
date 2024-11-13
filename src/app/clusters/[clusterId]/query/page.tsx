import { ClusterBreadcrumb } from "@/components/cluster/cluster-breadcrumb"
import { QueryWorkspaceWrapper } from "@/components/query/query-workspace-wrapper"

export default async function QueryPage(props: { params: Promise<{ clusterId: string }> }) {
  const params = await props.params;
  return (
    <div className="flex h-full flex-col">
      <ClusterBreadcrumb clusterId={params.clusterId} currentPage="数据查询" />
      <div className="flex-1 border-t mt-3">
        <QueryWorkspaceWrapper clusterId={params.clusterId} />
      </div>
    </div>
  )
} 