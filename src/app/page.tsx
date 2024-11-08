import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ClusterOverview } from "@/components/cluster/cluster-overview"
import { ClustersList } from "@/components/cluster/clusters-list"
import { AddClusterDialog } from "@/components/cluster/add-cluster-dialog"

export default function Home() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">集群概览</h1>
          <AddClusterDialog />
        </div>
        <ClusterOverview />
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">集群列表</h2>
          </div>
          <ClustersList />
        </div>
      </div>
    </DashboardLayout>
  )
} 