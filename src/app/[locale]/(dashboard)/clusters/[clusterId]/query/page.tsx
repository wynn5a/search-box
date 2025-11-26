import { QueryWorkspace } from "@/components/query/query-workspace"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function QueryPage(props: { 
  params: Promise<{ clusterId: string }> 
}) {
  const params = await props.params;
  
  return (
    <div className="h-full flex flex-col py-4">
      <div className="flex-1 min-h-0">
        <QueryWorkspace clusterId={params.clusterId} />
      </div>
    </div>
  )
}
