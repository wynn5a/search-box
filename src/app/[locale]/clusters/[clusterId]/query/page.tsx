import { ClusterBreadcrumb } from "@/components/cluster/cluster-breadcrumb"
import { QueryWorkspace } from "@/components/query/query-workspace"
import { Separator } from "@/components/ui/separator"
import { getTranslations } from "next-intl/server"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function QueryPage(props: { 
  params: Promise<{ clusterId: string }> 
}) {
  const params = await props.params;
  const t = await getTranslations()
  
  return (
    <div className="h-full flex flex-col py-4">
      <div className="flex-none">
        <div className="flex items-center justify-between">
          <ClusterBreadcrumb 
            clusterId={params.clusterId} 
            currentPage={t('clusters.query.title')}
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