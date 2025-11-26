import {
  ClusterOverview,
  ClusterSettings,
  ClusterIndices
} from "@/components/cluster"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { List, Settings } from "lucide-react"
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
