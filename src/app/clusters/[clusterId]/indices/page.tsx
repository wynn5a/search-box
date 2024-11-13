import { IndicesList } from "@/components/indices/indices-list"
import { ClusterBreadcrumb } from "@/components/cluster/cluster-breadcrumb"

export default async function IndicesPage(props: { params: Promise<{ clusterId: string }> }) {
  const params = await props.params;
  return (
    <div className="flex flex-col gap-6">
      <ClusterBreadcrumb clusterId={params.clusterId} currentPage="索引管理" />
      <IndicesList clusterId={params.clusterId} />
    </div>
  )
} 