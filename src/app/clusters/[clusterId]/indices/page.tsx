import { IndicesList } from "@/components/indices/indices-list"
import { IndicesStats } from "@/components/indices/indices-stats"
import { ClusterBreadcrumb } from "@/components/cluster/cluster-breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function IndicesPage(props: { params: Promise<{ clusterId: string }> }) {
  const params = await props.params;
  return (
    <div className="h-full flex flex-col">
      <div className="flex-none px-6 py-3 border-b">
        <ClusterBreadcrumb 
          clusterId={params.clusterId} 
          currentPage="索引管理" 
        />
      </div>
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <IndicesStats clusterId={params.clusterId} />
        <Card>
          <CardHeader>
            <CardTitle>索引列表</CardTitle>
          </CardHeader>
          <CardContent>
            <IndicesList clusterId={params.clusterId} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}