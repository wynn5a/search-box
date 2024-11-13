import { ClustersList } from "@/components/cluster/clusters-list"
import { AddClusterDialog } from "@/components/cluster/add-cluster-dialog"

// 添加这个配置来禁用静态生成
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">集群管理</h1>
        <AddClusterDialog />
      </div>
      <ClustersList />
    </div>
  )
} 