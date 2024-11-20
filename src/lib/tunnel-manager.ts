import { Client } from 'ssh2'
import { createServer, Server } from 'net'
import { ConnectConfig } from 'ssh2'
import { EventEmitter } from 'events'

// 设置全局最大监听器数量
EventEmitter.defaultMaxListeners = 20

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
  connections: Set<any>
  lastUsed: number
  sshClient?: Client
}

class TunnelManager {
  private static instance: TunnelManager
  private tunnels: Map<string, TunnelInfo> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null
  private exitHandler: () => Promise<void>

  private constructor() {
    // 启动定期清理
    this.cleanupInterval = setInterval(() => this.cleanupUnusedTunnels(), 60000)

    // 创建一个单一的退出处理函数
    this.exitHandler = async () => {
      console.log('Cleaning up tunnels before exit...')
      await this.cleanup()
      process.exit()
    }

    // 只添加一次事件监听器
    process.once('exit', () => {
      void this.cleanup()
    })

    process.once('SIGINT', this.exitHandler)
    process.once('SIGTERM', this.exitHandler)
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
    let attempts = 0
    const maxAttempts = 5  // 最多尝试5次

    while (!(await this.isPortAvailable(port)) && attempts < maxAttempts) {
      port++
      attempts++
    }

    if (attempts >= maxAttempts) {
      throw new Error(`Unable to find available port after ${maxAttempts} attempts starting from ${startPort}`)
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

    let localPort: number
    try {
      localPort = await this.getAvailablePort(config.localPort)
    } catch (error: any) {
      throw new Error(`Failed to create tunnel: ${error.message}`)
    }

    return new Promise((resolve, reject) => {
      const server = createServer(async (connection) => {
        const ssh = new Client()
        const tunnelInfo = this.tunnels.get(clusterId)
        if (tunnelInfo) {
          tunnelInfo.connections.add(connection)
          tunnelInfo.lastUsed = Date.now()
          tunnelInfo.sshClient = ssh
        }

        connection.on('error', (err) => {
          console.error(`Connection error for cluster ${clusterId}:`, err)
          connection.end()
        })

        connection.on('end', () => {
          if (tunnelInfo) {
            tunnelInfo.connections.delete(connection)
          }
        })

        ssh.on('ready', () => {
          ssh.forwardOut(
            '127.0.0.1',
            localPort,
            config.remoteHost,
            config.remotePort,
            (err, stream) => {
              if (err) {
                console.error(`SSH forward error for cluster ${clusterId}:`, err)
                connection.end()
                return
              }

              connection.pipe(stream).pipe(connection)
            }
          )
        })

        ssh.on('error', (err) => {
          console.error(`SSH error for cluster ${clusterId}:`, err)
          connection.end()
          if (tunnelInfo) {
            tunnelInfo.connections.delete(connection)
          }
        })

        const sshConfig: ConnectConfig = {
          host: config.sshHost,
          port: config.sshPort,
          username: config.sshUser,
          readyTimeout: 30000,
          keepaliveInterval: 10000,
        }

        if (config.sshPassword) {
          sshConfig.password = config.sshPassword
        } else if (config.sshKeyFile) {
          try {
            const fs = require('fs')
            sshConfig.privateKey = fs.readFileSync(config.sshKeyFile)
          } catch (error) {
            console.error(`Failed to read SSH key file for cluster ${clusterId}:`, error)
            connection.end()
            return
          }
        }

        ssh.connect(sshConfig)
      })

      server.on('error', (err) => {
        console.error(`Server error for cluster ${clusterId}:`, err)
        reject(err)
      })

      server.listen(localPort, '127.0.0.1', () => {
        this.tunnels.set(clusterId, {
          server,
          connections: new Set(),
          lastUsed: Date.now()
        })
        console.log(`Tunnel created for cluster ${clusterId} on port ${localPort}`)
        resolve(server)
      })
    })
  }

  public async closeTunnel(clusterId: string): Promise<void> {
    const tunnelInfo = this.tunnels.get(clusterId)
    if (tunnelInfo) {
      return new Promise((resolve) => {
        // 关闭 SSH 客户端
        if (tunnelInfo.sshClient) {
          tunnelInfo.sshClient.end()
        }

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

  public getActualPort(clusterId: string): number | null {
    const tunnelInfo = this.tunnels.get(clusterId)
    if (!tunnelInfo) {
      return null
    }
    const address = tunnelInfo.server.address()
    if (typeof address === 'string' || !address) {
      return null
    }
    return address.port
  }

  // 清理所有资源
  public async cleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    
    // 使用 Array.from 来避免迭代器问题
    const clusterIds = Array.from(this.tunnels.keys())
    for (const clusterId of clusterIds) {
      await this.closeTunnel(clusterId)
    }

    // 移除事件监听器
    process.removeListener('SIGINT', this.exitHandler)
    process.removeListener('SIGTERM', this.exitHandler)
  }
}

export const tunnelManager = TunnelManager.getInstance()