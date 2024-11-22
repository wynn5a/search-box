import { ClusterBreadcrumb } from "@/components/cluster/cluster-breadcrumb"
import { IndexMappings } from "@/components/cluster/index-mappings"
import { IndexOverview } from "@/components/cluster/index-overview"
import { IndexSettings } from "@/components/cluster/index-settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function IndexPage(props: { 
  params: Promise<{ clusterId: string; index: string }> 
}) {
  const params = await props.params;
  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-6 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <ClusterBreadcrumb 
          indexName={params.index}
          clusterId={params.clusterId} 
          currentPage={params.index} 
        />
      </div>
      <div className="flex-1 p-6 space-y-6">
        <Card className="p-6">
          <IndexOverview 
            clusterId={params.clusterId} 
            indexName={params.index} 
          />
        </Card>
        <Tabs defaultValue="settings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="settings">索引设置</TabsTrigger>
            <TabsTrigger value="mappings">映射管理</TabsTrigger>
          </TabsList>
          <TabsContent value="settings" className="space-y-4 mt-6">
            <Card className="p-6">
              <IndexSettings 
                clusterId={params.clusterId} 
                indexName={params.index} 
              />
            </Card>
          </TabsContent>
          <TabsContent value="mappings" className="space-y-4 mt-6">
            <Card className="p-6">
              <IndexMappings 
                clusterId={params.clusterId} 
                indexName={params.index} 
              />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}