import { ClusterBreadcrumb } from "@/components/cluster/cluster-breadcrumb"
import { IndexMappings } from "@/components/cluster/index-mappings"
import { IndexOverview } from "@/components/cluster/index-overview"
import { IndexSettings } from "@/components/cluster/index-settings"
import { IndexStats } from "@/components/cluster/index-stats"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function IndexPage(props: { 
  params: Promise<{ clusterId: string; index: string }> 
}) {
  const params = await props.params;
  return (
    <div className="flex flex-col space-y-6">
      <div className="px-6 py-3">
        <ClusterBreadcrumb 
          clusterId={params.clusterId} 
          currentPage={`索引: ${params.index}`} 
        />
      </div>
      <Separator />
      <div className="p-6 space-y-6">
        <IndexOverview 
          clusterId={params.clusterId} 
          indexName={params.index} 
        />
        <Tabs defaultValue="settings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="settings">索引设置</TabsTrigger>
            <TabsTrigger value="mappings">映射管理</TabsTrigger>
            <TabsTrigger value="stats">统计信息</TabsTrigger>
          </TabsList>
          <TabsContent value="settings" className="space-y-4">
            <IndexSettings 
              clusterId={params.clusterId} 
              indexName={params.index} 
            />
          </TabsContent>
          <TabsContent value="mappings" className="space-y-4">
            <IndexMappings 
              clusterId={params.clusterId} 
              indexName={params.index} 
            />
          </TabsContent>
          <TabsContent value="stats" className="space-y-4">
            <IndexStats 
              clusterId={params.clusterId} 
              indexName={params.index} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 