import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "OpenSearch Manager",
  description: "OpenSearch 集群管理工具",
}

// 添加这个配置来禁用静态生成
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}