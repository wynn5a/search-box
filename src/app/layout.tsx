import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "OpenSearch Manager",
  description: "OpenSearch 集群管理工具",
}

// 添加这个配置来禁用静态生成
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DashboardLayout>
            {children}
          </DashboardLayout>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
} 