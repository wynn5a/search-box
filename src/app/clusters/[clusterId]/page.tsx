import { ClusterDetail } from "@/components/cluster/cluster-detail"

export default async function ClusterDetailPage(props: { params: Promise<{ clusterId: string }> }) {
  const params = await props.params;
  return (
    <div className="flex flex-col gap-6">
      <ClusterDetail clusterId={params.clusterId} />
    </div>
  )
} 