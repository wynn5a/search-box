import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ClusterDetail } from "@/components/cluster/cluster-detail"

export default async function ClusterDetailPage(props: { params: Promise<{ clusterId: string }> }) {
  const params = await props.params;
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <ClusterDetail clusterId={params.clusterId} />
      </div>
    </DashboardLayout>
  )
} 