import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ClustersList } from "@/components/cluster/clusters-list"
import { AddClusterDialog } from "@/components/cluster/add-cluster-dialog"

export default function ClustersPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">集群管理</h1>
          <AddClusterDialog />
        </div>
        <ClustersList />
      </div>
    </DashboardLayout>
  )
} 