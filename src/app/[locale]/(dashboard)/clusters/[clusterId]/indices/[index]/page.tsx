import { IndexMappings } from "@/components/cluster/index-mappings"
import { IndexOverview } from "@/components/cluster/index-overview"
import { IndexSettings } from "@/components/cluster/index-settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getTranslations } from "next-intl/server"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function IndexPage(props: {
  params: Promise<{ clusterId: string; index: string }>
}) {
  const params = await props.params;
  const t = await getTranslations('index')

  return (
    <div className="flex flex-col h-[calc(100vh-65px)]">
      <div className="flex-1 p-6 space-y-6">
        <IndexOverview
          clusterId={params.clusterId}
          indexName={params.index}
        />
        <Tabs defaultValue="settings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="settings">{t('tabs.settings')}</TabsTrigger>
            <TabsTrigger value="mappings">{t('tabs.mappings')}</TabsTrigger>
          </TabsList>
          <TabsContent value="settings">
            <IndexSettings
              clusterId={params.clusterId}
              indexName={params.index}
            />
          </TabsContent>
          <TabsContent value="mappings">
            <IndexMappings
              clusterId={params.clusterId}
              indexName={params.index}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
