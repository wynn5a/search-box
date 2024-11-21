import { Client } from 'ssh2'
import { createServer, Server } from 'net'
import { ConnectConfig, AuthenticationType, AuthHandlerMiddleware } from 'ssh2'
import { EventEmitter } from 'events'
import { decrypt } from './utils/crypto'

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
    // 启动定期清理，每分钟检查一次
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
      this.updateTunnelLastUsed(clusterId)
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

        ssh.on('error', (err) => {
          console.error(`SSH error for cluster ${clusterId}:`, err)
          connection.end()
          if (tunnelInfo) {
            tunnelInfo.connections.delete(connection)
          }
        })

        ssh.on('ready', () => {
          console.debug(`SSH connection ready for cluster ${clusterId}`)
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
              console.debug(`SSH tunnel established for cluster ${clusterId}`)
              connection.pipe(stream).pipe(connection)
            }
          )
        })

        ssh.on('keyboard-interactive', (name: string, instructions: string, lang: string, prompts: any[], finish: (responses: string[]) => void) => {
          if (config.sshPassword && prompts.length > 0) {
            finish([config.sshPassword])
          } else {
            finish([])
          }
        })

        ssh.on('error', (err) => {
          console.error(`SSH Authentication Error [${clusterId}]:`, err.message)
        })

        const sshConfig: ConnectConfig = {
          host: config.sshHost,
          port: config.sshPort,
          username: config.sshUser,
          keepaliveInterval: 10000,  // 每10秒发送一次 keepalive
          readyTimeout: 30000,       // 30秒连接超时
          // debug: (msg: string) => console.debug(`SSH Debug [${clusterId}]: ${msg}`),
          algorithms: {
            kex: [
              'ecdh-sha2-nistp256',
              'ecdh-sha2-nistp384',
              'ecdh-sha2-nistp521',
              'diffie-hellman-group-exchange-sha256',
              'diffie-hellman-group14-sha256',
              'diffie-hellman-group14-sha1'
            ]
          }
        }

        let retryCount = 0
        const MAX_RETRIES = 3
        const RETRY_DELAY = 1000
        let isConnected = false
        let lastActivity = Date.now()
        const ACTIVITY_TIMEOUT = 30000  // 30 seconds

        const attemptConnection = () => {
          if (retryCount >= MAX_RETRIES) {
            console.error(`SSH connection failed after ${MAX_RETRIES} attempts for cluster ${clusterId}`)
            connection.end()
            return
          }
          ssh.connect(sshConfig)
        }

        ssh.on('ready', () => {
          console.log(`SSH connection ready for cluster ${clusterId}`)
          isConnected = true
          lastActivity = Date.now()
          retryCount = 0  // 重置重试计数
        })

        ssh.on('error', (err) => {
          console.error(`SSH connection error for cluster ${clusterId}:`, err)
          isConnected = false
          retryCount++
          if (retryCount < MAX_RETRIES) {
            console.log(`Retrying SSH connection for cluster ${clusterId} (attempt ${retryCount + 1}/${MAX_RETRIES})...`)
            setTimeout(attemptConnection, RETRY_DELAY)
          } else {
            connection.end()
          }
        })

        ssh.on('close', () => {
          console.log(`SSH connection closed for cluster ${clusterId}`)
          isConnected = false
          connection.end()
        })

        ssh.on('end', () => {
          console.log(`SSH connection ended for cluster ${clusterId}`)
          isConnected = false
          connection.end()
        })

        // 添加密码认证
        if (config.sshPassword) {
          try {
            // 解密密码
            const decryptedPassword = decrypt(config.sshPassword)
            sshConfig.password = decryptedPassword
            console.debug(`SSH Debug [${clusterId}]: Password decrypted successfully`)

            // 添加密码认证方法
            sshConfig.authHandler = ['password'] as AuthenticationType[]
          } catch (error) {
            console.error(`Failed to process SSH password for cluster ${clusterId}:`, error)
            connection.end()
            return
          }
        } else if (config.sshKeyFile) {
          try {
            const fs = require('fs')
            const privateKey = fs.readFileSync(config.sshKeyFile)
            sshConfig.privateKey = privateKey

            // 检查密钥格式
            if (!privateKey.toString().includes('PRIVATE KEY')) {
              throw new Error('Invalid SSH private key format')
            }

            // 添加密钥认证方法
            sshConfig.authHandler = ['publickey'] as AuthenticationType[]
          } catch (error) {
            console.error(`Failed to read SSH key file for cluster ${clusterId}:`, error)
            connection.end()
            return
          }
        }

        attemptConnection()
      })

      // 在创建服务器时就初始化和存储 tunnelInfo
      const tunnelInfo: TunnelInfo = {
        server,
        connections: new Set(),
        lastUsed: Date.now(),
        sshClient: undefined
      }
      this.tunnels.set(clusterId, tunnelInfo)

      server.listen(localPort, '127.0.0.1', () => {
        console.log(`Tunnel server listening on port ${localPort} for cluster ${clusterId}`)
        resolve(server)
      })

      server.on('error', (err) => {
        console.error(`Server error for cluster ${clusterId}:`, err)
        this.tunnels.delete(clusterId)
        reject(err)
      })
    })
  }

  public async closeTunnel(clusterId: string): Promise<void> {
    const tunnelInfo = this.tunnels.get(clusterId)
    console.log(`Closing SSH tunnel for cluster ${clusterId}`)
    
    if (!tunnelInfo) {
      console.log(`No tunnel found for cluster ${clusterId}`)
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      const cleanup = () => {
        this.tunnels.delete(clusterId)
        console.log(`SSH tunnel closed and removed for cluster ${clusterId}`)
        resolve()
      }

      try {
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
        if (tunnelInfo.server.listening) {
          tunnelInfo.server.close(() => {
            cleanup()
          })
        } else {
          cleanup()
        }
      } catch (error) {
        console.error(`Error during tunnel cleanup for cluster ${clusterId}:`, error)
        cleanup()
      }
    })
  }

  private async cleanupUnusedTunnels() {
    const now = Date.now()
    const IDLE_TIMEOUT = 5 * 60 * 1000  // 5 minutes in milliseconds

    console.debug('Running tunnel cleanup check...')

    // 使用 Array.from 来避免迭代器问题
    const entries = Array.from(this.tunnels.entries())
    for (const [clusterId, tunnelInfo] of entries) {
      const idleTime = now - tunnelInfo.lastUsed
      if (idleTime > IDLE_TIMEOUT) {
        console.log(`Tunnel ${clusterId} has been idle for ${Math.round(idleTime / 1000)}s, cleaning up...`)
        await this.closeTunnel(clusterId)
      }
    }
  }

  public updateTunnelLastUsed(clusterId: string) {
    const tunnelInfo = this.tunnels.get(clusterId)
    if (tunnelInfo) {
      tunnelInfo.lastUsed = Date.now()
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