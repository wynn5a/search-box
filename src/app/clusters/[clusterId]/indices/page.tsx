import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { IndicesList } from "@/components/indices/indices-list"
import { ClusterBreadcrumb } from "@/components/cluster/cluster-breadcrumb"

export default async function IndicesPage(props: { params: Promise<{ clusterId: string }> }) {
  const params = await props.params;
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <ClusterBreadcrumb clusterId={params.clusterId} currentPage="索引管理" />
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">索引管理</h1>
        </div>
        <IndicesList clusterId={params.clusterId} />
      </div>
    </DashboardLayout>
  )
} 