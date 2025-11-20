import {
  ClusterOverview,
  ClusterBreadcrumb,
  ClusterSettings,
  ClusterIndices
} from "@/components/cluster"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { List, Search, Settings } from "lucide-react"
import Link from "next/link"
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Props {
  params: Promise<{ clusterId: string }>
}

export default async function ClusterPage(props: Props) {
  const params = await props.params;
  const t = await getTranslations()

  return (
    <div className="flex flex-col h-[calc(100vh-65px)]">
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center space-x-2">
          <ClusterBreadcrumb
            clusterId={params.clusterId}
            currentPage={t('cluster.page.overview')}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Link href={`/clusters/${params.clusterId}/query`}>
            <Button variant="outline" size="sm">
              <Search className="mr-2 h-4 w-4" />
              {t('cluster.page.query')}
            </Button>
          </Link>
        </div>
      </div>
      <div className="flex-1 min-h-0 space-y-6 p-6">
        <ClusterOverview clusterId={params.clusterId} />
        <div className="flex space-x-2 items-center">
          <Tabs defaultValue="indices" className="flex-1">
            <TabsList className="mb-2">
              <TabsTrigger value="indices"><List className="mr-2 h-4 w-4" />{t('cluster.page.tabs.indices')}</TabsTrigger>
              <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4" />{t('cluster.page.tabs.settings')}</TabsTrigger>
            </TabsList>
            <TabsContent value="indices" className="flex-1 mt-2 data-[state=active]:flex data-[state=active]:flex-col">
              <ClusterIndices clusterId={params.clusterId} />
            </TabsContent>
            <TabsContent value="settings" className="flex-1 mt-2 data-[state=active]:flex data-[state=active]:flex-col">
              <ClusterSettings clusterId={params.clusterId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}