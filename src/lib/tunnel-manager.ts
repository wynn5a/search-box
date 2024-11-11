import { Client } from 'ssh2'
import { createServer, Server } from 'net'
import { ConnectConfig } from 'ssh2'

interface TunnelConfig {
  sshHost: string
  sshPort: number
  sshUser: string
  sshPassword?: string
  sshKeyFile?: string
  localPort: number
  remoteHost: string
  remotePort: number
}

interface TunnelInfo {
  server: Server
  connections: Set<any>  // 存储所有活动连接
  lastUsed: number
}

class TunnelManager {
  private static instance: TunnelManager
  private tunnels: Map<string, TunnelInfo> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  private constructor() {
    // 启动定期清理
    this.cleanupInterval = setInterval(() => this.cleanupUnusedTunnels(), 60000)
  }

  public static getInstance(): TunnelManager {
    if (!TunnelManager.instance) {
      TunnelManager.instance = new TunnelManager()
    }
    return TunnelManager.instance
  }

  private async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = createServer()
      server.once('error', () => {
        server.close()
        resolve(false)
      })
      server.once('listening', () => {
        server.close()
        resolve(true)
      })
      server.listen(port, '127.0.0.1')
    })
  }

  private async getAvailablePort(startPort: number): Promise<number> {
    let port = startPort
    while (!(await this.isPortAvailable(port))) {
      port++
    }
    return port
  }

  public async createTunnel(clusterId: string, config: TunnelConfig): Promise<Server> {
    // 如果已存在隧道，更新最后使用时间并返回
    const existingTunnel = this.tunnels.get(clusterId)
    if (existingTunnel) {
      existingTunnel.lastUsed = Date.now()
      return existingTunnel.server
    }

    const localPort = await this.getAvailablePort(config.localPort)

    return new Promise((resolve, reject) => {
      const server = createServer(async (connection) => {
        const ssh = new Client()
        const tunnelInfo = this.tunnels.get(clusterId)
        if (tunnelInfo) {
          tunnelInfo.connections.add(connection)
          tunnelInfo.lastUsed = Date.now()
        }

        ssh.on('ready', () => {
          ssh.forwardOut(
            '127.0.0.1',
            localPort,
            config.remoteHost,
            config.remotePort,
            (err, stream) => {
              if (err) {
                connection.end()
                return
              }

              connection.pipe(stream)
              stream.pipe(connection)

              connection.on('close', () => {
                stream.end()
                ssh.end()
                const tunnelInfo = this.tunnels.get(clusterId)
                if (tunnelInfo) {
                  tunnelInfo.connections.delete(connection)
                }
              })
            }
          )
        })

        ssh.on('error', (err) => {
          console.error(`SSH connection error for cluster ${clusterId}:`, err)
          connection.end()
          const tunnelInfo = this.tunnels.get(clusterId)
          if (tunnelInfo) {
            tunnelInfo.connections.delete(connection)
          }
        })

        const sshConfig: ConnectConfig = {
          host: config.sshHost,
          port: config.sshPort,
          username: config.sshUser,
          password: config.sshPassword,
          privateKey: config.sshKeyFile,
          keepaliveInterval: 10000,
        }

        ssh.connect(sshConfig)
      })

      server.on('error', (err) => {
        console.error(`Tunnel server error for cluster ${clusterId}:`, err)
        this.tunnels.delete(clusterId)
        reject(err)
      })

      server.listen(localPort, '127.0.0.1', () => {
        console.log(`SSH tunnel created for cluster ${clusterId} on port ${localPort}`)
        this.tunnels.set(clusterId, {
          server,
          connections: new Set(),
          lastUsed: Date.now()
        })
        resolve(server)
      })
    })
  }

  public async closeTunnel(clusterId: string): Promise<void> {
    const tunnelInfo = this.tunnels.get(clusterId)
    if (tunnelInfo) {
      return new Promise((resolve) => {
        // 关闭所有活动连接
        tunnelInfo.connections.forEach(connection => {
          try {
            connection.end()
          } catch (e) {
            console.error(`Error closing connection for cluster ${clusterId}:`, e)
          }
        })
        
        // 清空连接集合
        tunnelInfo.connections.clear()
        
        // 关闭服务器
        tunnelInfo.server.close(() => {
          this.tunnels.delete(clusterId)
          console.log(`SSH tunnel closed for cluster ${clusterId}`)
          resolve()
        })
      })
    }
  }

  private async cleanupUnusedTunnels() {
    const now = Date.now()
    const timeout = 5 * 60 * 1000 // 5 minutes

    // 使用 Array.from 来避免迭代器问题
    const entries = Array.from(this.tunnels.entries())
    for (const [clusterId, tunnelInfo] of entries) {
      if (now - tunnelInfo.lastUsed > timeout && tunnelInfo.connections.size === 0) {
        console.log(`Cleaning up unused tunnel for cluster ${clusterId}`)
        await this.closeTunnel(clusterId)
      }
    }
  }

  public getTunnelStatus(clusterId: string): boolean {
    return this.tunnels.has(clusterId)
  }

  // 清理所有资源
  public async cleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    
    // 使用 Array.from 来避免迭代器问题
    const clusterIds = Array.from(this.tunnels.keys())
    for (const clusterId of clusterIds) {
      await this.closeTunnel(clusterId)
    }
  }
}

export const tunnelManager = TunnelManager.getInstance()

// 确保在进程退出时清理资源
process.on('exit', () => {
  tunnelManager.cleanup().catch(console.error)
})

process.on('SIGINT', () => {
  tunnelManager.cleanup().catch(console.error)
  process.exit()
})