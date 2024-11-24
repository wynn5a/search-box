import { ClusterBreadcrumb } from "@/components/cluster/cluster-breadcrumb"
import { QueryWorkspace } from "@/components/query/query-workspace"
import { Separator } from "@/components/ui/separator"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function QueryPage(props: { 
  params: Promise<{ clusterId: string }> 
}) {
  const params = await props.params;
  return (
    <div className="h-full flex flex-col py-4">
      <div className="flex-none">
        <div className="flex items-center justify-between">
          <ClusterBreadcrumb 
            clusterId={params.clusterId} 
            currentPage="数据查询" 
          />
        </div>
      </div>
      <Separator className="flex-none my-4" />
      <div className="flex-1 min-h-0">
        <QueryWorkspace clusterId={params.clusterId} />
      </div>
    </div>
  )
} 