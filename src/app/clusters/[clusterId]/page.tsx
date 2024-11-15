import { 
  ClusterOverview,
  ClusterBreadcrumb,
  ClusterSettings,
  ClusterIndices 
} from "@/components/cluster"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ClusterPage(props: { params: Promise<{ clusterId: string }> }) {
  const params = await props.params;
  return (
    <div className="flex flex-col space-y-6">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <ClusterBreadcrumb clusterId={params.clusterId} currentPage="概览" />
          <Link href={`/clusters/${params.clusterId}/query`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Search className="h-4 w-4" />
              数据查询
            </Button>
          </Link>
        </div>
      </div>
      <Separator />
      <div className="p-6 space-y-6">
        <ClusterOverview clusterId={params.clusterId} />
        <Tabs defaultValue="indices" className="space-y-4">
          <TabsList>
            <TabsTrigger value="indices">索引管理</TabsTrigger>
            <TabsTrigger value="settings">集群设置</TabsTrigger>
          </TabsList>
          <TabsContent value="indices" className="space-y-4">
            <ClusterIndices clusterId={params.clusterId} />
          </TabsContent>
          <TabsContent value="settings" className="space-y-4">
            <ClusterSettings clusterId={params.clusterId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 