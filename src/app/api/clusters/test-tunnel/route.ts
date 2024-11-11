import { NextResponse } from "next/server"
import { handleApiRoute } from "@/lib/utils/api-utils"
import { tunnelManager } from "@/lib/tunnel-manager"
import { ApiError } from "@/lib/errors/api-error"

// 获取一个随机的可用端口
function getRandomPort(min: number = 10000, max: number = 65535): number {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export async function POST(request: Request) {
  return handleApiRoute(async () => {
    const body = await request.json()
    
    try {
      // 使用临时的测试 ID
      const testId = 'test-' + Date.now()
      // 使用随机端口
      const testPort = getRandomPort()
      
      console.log('Testing SSH tunnel with config:', {
        ...body,
        password: body.sshPassword ? '***' : undefined,
        keyFile: body.sshKeyFile ? '***' : undefined,
        testPort,
      })

      // 先测试 SSH 隧道连接
      await tunnelManager.createTunnel(testId, {
        sshHost: body.sshHost,
        sshPort: body.sshPort || 22,
        sshUser: body.sshUser,
        sshPassword: body.sshPassword,
        sshKeyFile: body.sshKeyFile,
        localPort: testPort,
        remoteHost: body.remoteHost || 'localhost',
        remotePort: body.remotePort || 9200,
      })

      console.log('SSH tunnel created successfully')

      // 测试完成后关闭隧道
      await tunnelManager.closeTunnel(testId)
      console.log('SSH tunnel closed successfully')
      
      return { success: true }
    } catch (error) {
      console.error('SSH tunnel test error:', error)

      // 确保清理隧道
      try {
        await tunnelManager.closeTunnel('test-' + Date.now())
      } catch (e) {
        console.error('Error cleaning up tunnel:', e)
      }

      // 提供更具体的错误信息
      let errorMessage = 'SSH tunnel test failed'
      let errorDetails = error instanceof Error ? error.message : 'Unknown error'

      if (error instanceof Error) {
        if (error.message.includes('ECONNREFUSED')) {
          errorMessage = 'SSH 连接被拒绝'
          errorDetails = '请检查 SSH 主机地址和端口是否正确'
        } else if (error.message.includes('Authentication failed')) {
          errorMessage = 'SSH 认证失败'
          errorDetails = '请检查用户名和密码/密钥是否正确'
        } else if (error.message.includes('ETIMEDOUT')) {
          errorMessage = 'SSH 连接超时'
          errorDetails = '请检查网络连接和防火墙设置'
        }
      }

      throw new ApiError(
        errorMessage,
        400,
        errorDetails
      )
    }
  })
} 