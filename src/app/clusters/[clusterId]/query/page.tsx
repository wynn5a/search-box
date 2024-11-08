import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { QueryEditor } from "@/components/query/query-editor"
import { ClusterBreadcrumb } from "@/components/cluster/cluster-breadcrumb"

export default async function QueryPage(props: { params: Promise<{ clusterId: string }> }) {
  const params = await props.params;
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <ClusterBreadcrumb clusterId={params.clusterId} currentPage="数据查询" />
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">数据查询</h1>
        </div>
        <QueryEditor clusterId={params.clusterId} />
      </div>
    </DashboardLayout>
  )
} 