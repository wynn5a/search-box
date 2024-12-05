import { IndicesList } from "@/components/indices/indices-list"
import { IndicesStats } from "@/components/indices/indices-stats"
import { ClusterBreadcrumb } from "@/components/cluster/cluster-breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTranslations } from 'next-intl/server'

export default async function IndicesPage(props: { params: Promise<{ clusterId: string }> }) {
  const params = await props.params;
  const t = await getTranslations('clusters');

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none px-6 py-3 border-b">
        <ClusterBreadcrumb 
          clusterId={params.clusterId} 
          currentPage={t('indices_management')} 
        />
      </div>
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <IndicesStats clusterId={params.clusterId} />
        <Card>
          <CardHeader>
            <CardTitle>{t('indices_list')}</CardTitle>
          </CardHeader>
          <CardContent>
            <IndicesList clusterId={params.clusterId} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}