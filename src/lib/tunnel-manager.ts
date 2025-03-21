import { createTunnel, ForwardOptions } from 'tunnel-ssh'
import { Server, ListenOptions } from 'net'
import { ConnectConfig, Client } from 'ssh2'
import { EventEmitter } from 'events'
import { decrypt } from './utils/crypto'

// 设置全局最大监听器数量
EventEmitter.defaultMaxListeners = 30

// Define TunnelOptions matching the actual package implementation
interface TunnelOptions {
  autoClose: boolean;
  reconnectOnError: boolean;
}

interface TunnelConfig {
  sshHost: string
  sshPort: number
  sshUser: string
  sshPassword?: string
  sshKeyFile?: string
  localPort: number
  clusterUrl: string
}

interface TunnelInfo {
  server: Server
  lastUsed: number
  tunnelInstance?: Client | any // SSH client or any other instance
  localPort: number
  dstHost: string
  dstPort: number
  status: 'creating' | 'active' | 'error' | 'cleaning'
  creationPromise?: Promise<void>
}

class TunnelManager {
  private static instance: TunnelManager
  private tunnels: Map<string, TunnelInfo> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null
  private exitHandler: () => Promise<void>
  private portCache: Map<number, boolean> = new Map() // Cache for port availability
  private cleaningTunnels: Set<string> = new Set() // Track tunnels being cleaned up

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

  // Check if a port is available with caching for faster checks
  private async isPortAvailable(port: number): Promise<boolean> {
    // Check cache first
    if (this.portCache.has(port)) {
      return this.portCache.get(port) as boolean
    }

    return new Promise((resolve) => {
      const server = new Server()
      
      // Use a timer to limit how long we wait
      const timer = setTimeout(() => {
        try {
          server.close()
        } catch (e) {
          // Ignore errors during close
        }
        this.portCache.set(port, false) // Cache result
        resolve(false)
      }, 500) // 500ms timeout

      server.once('error', () => {
        clearTimeout(timer)
        server.close()
        this.portCache.set(port, false) // Cache result
        resolve(false)
      })
      
      server.once('listening', () => {
        clearTimeout(timer)
        server.close()
        this.portCache.set(port, true) // Cache result
        resolve(true)
      })
      
      server.listen(port, '127.0.0.1')
    })
  }

  // Get the next available port faster
  private async getAvailablePort(startPort: number): Promise<number> {
    let port = startPort
    let attempts = 0
    const maxAttempts = 10 // Try more ports for better chances

    // Try multiple ports in parallel for faster finding
    const portPromises = []
    for (let i = 0; i < maxAttempts; i++) {
      portPromises.push(this.isPortAvailable(startPort + i).then(available => ({
        port: startPort + i,
        available
      })))
    }

    // Wait for results and find the first available port
    const results = await Promise.all(portPromises)
    const availablePort = results.find(result => result.available)
    if (availablePort) {
      return availablePort.port
    }

    // If no ports found, try sequentially
    while (!(await this.isPortAvailable(port)) && attempts < maxAttempts) {
      port++
      attempts++
    }

    if (attempts >= maxAttempts) {
      throw new Error(`Unable to find available port after ${maxAttempts} attempts starting from ${startPort}`)
    }

    return port
  }

  public async createTunnel(id: string, config: TunnelConfig): Promise<void> {
    // Reuse existing tunnel if it exists
    const existingTunnel = this.tunnels.get(id)
    
    if (existingTunnel) {
      // If the tunnel is currently being created, wait for it
      if (existingTunnel.status === 'creating' && existingTunnel.creationPromise) {
        try {
          await existingTunnel.creationPromise
        } catch (error) {
          // If creation failed, we'll try again
          await this.closeTunnel(id)
        }
      }
      
      // If tunnel exists and is active, just update last used timestamp and return
      if (existingTunnel.status === 'active') {
        console.log(`Tunnel with ID ${id} already exists, reusing...`)
        existingTunnel.lastUsed = Date.now()
        return
      }
      
      // If tunnel exists but is in error state, close it and recreate
      if (existingTunnel.status === 'error') {
        await this.closeTunnel(id)
      }
    }

    // Create a promise for the tunnel creation to allow waiting
    const creationPromise = this._createTunnelInternal(id, config)
    
    // Store the tunnel with 'creating' status and the promise
    this.tunnels.set(id, {
      server: null as any, // Will be set once tunnel is created
      lastUsed: Date.now(),
      localPort: config.localPort,
      dstHost: 'localhost', // Will be updated
      dstPort: 9200, // Will be updated
      status: 'creating',
      creationPromise
    })

    // Start creating the tunnel
    try {
      await creationPromise
    } catch (error) {
      // If creation fails, update the status
      const tunnel = this.tunnels.get(id)
      if (tunnel) {
        tunnel.status = 'error'
      }
      throw error
    }
  }

  // Internal method for tunnel creation
  private async _createTunnelInternal(id: string, config: TunnelConfig): Promise<void> {
    try {
      // Extract hostname and port from cluster URL
      let dstPort = 9200; // Default fallback port
      let dstHost = 'localhost'; // Default fallback host
      try {
        const url = new URL(config.clusterUrl);
        // If port is specified in URL, use it
        // Otherwise use the default port for the protocol (443 for https, 80 for http)
        dstPort = parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80);
        dstHost = url.hostname || 'localhost'; // Use hostname from URL or default to localhost
        console.log(`Using port ${dstPort} for URL ${config.clusterUrl} (protocol: ${url.protocol})`);
      } catch {
        console.warn(`Invalid cluster URL format for ${id}: ${config.clusterUrl}, using defaults (localhost:9200)`);
      }
      
      // Check if the specified local port is available, if not find an available one
      let localPort = config.localPort;
      
      // Only check port availability if not already in portCache
      if (!this.portCache.has(localPort) || !this.portCache.get(localPort)) {
        if (!(await this.isPortAvailable(localPort))) {
          console.warn(`Port ${localPort} is already in use for cluster ${id}, finding an available port...`);
          localPort = await this.getAvailablePort(localPort + 1); // Try from next port
          console.log(`Found available port: ${localPort} for cluster ${id}`);
        }
      }
      
      // 准备SSH配置
      const sshOptions: ConnectConfig = {
        host: config.sshHost,
        port: config.sshPort,
        username: config.sshUser,
        readyTimeout: 30000, // Reduced from 60s to 30s
        keepaliveInterval: 5000, // Reduced from 10s to 5s for faster detection
        keepaliveCountMax: 3,
      }

      // 设置认证方式
      if (config.sshPassword) {
        try {
          // Only attempt to decrypt if the password appears to be in encrypted format
          if (config.sshPassword.includes(':')) {
            const decryptedPassword = decrypt(config.sshPassword)
            sshOptions.password = decryptedPassword
            console.log(`SSH Debug [${id}]: Password decrypted successfully`)
          } else {
            // Use the password as-is if it doesn't appear to be encrypted
            sshOptions.password = config.sshPassword
            console.log(`SSH Debug [${id}]: Using non-encrypted password`)
          }
        } catch (error) {
          console.error(`SSH Debug [${id}]: Failed to decrypt password:`, error)
          sshOptions.password = config.sshPassword // 如果解密失败，尝试使用原始密码
        }
      } else if (config.sshKeyFile) {
        sshOptions.privateKey = config.sshKeyFile
      }

      // 记录连接信息（不包含敏感信息）
      const logConfig = { ...sshOptions }
      if (logConfig.password) logConfig.password = '***'
      if (logConfig.privateKey) logConfig.privateKey = '***'
      console.log(`Connecting to SSH server for ${id}:`, {
        host: logConfig.host,
        port: logConfig.port,
        username: logConfig.username,
        authType: logConfig.password ? 'password' : 'privateKey'
      })

      // 使用 tunnel-ssh 创建隧道
      const tunnelOptions: TunnelOptions = {
        autoClose: false,
        reconnectOnError: true // Changed to true for better reliability
      }
      
      const serverOptions: ListenOptions = {
        host: '127.0.0.1',
        port: localPort
      }
      
      const forwardOptions: ForwardOptions = {
        srcAddr: '127.0.0.1',
        srcPort: localPort,
        dstAddr: dstHost,
        dstPort: dstPort
      }

      const [server, sshClient] = await createTunnel(tunnelOptions, serverOptions, sshOptions, forwardOptions)
      
      // Update the tunnel info with actual data
      const tunnelInfo = this.tunnels.get(id)
      if (tunnelInfo) {
        tunnelInfo.server = server
        tunnelInfo.tunnelInstance = sshClient
        tunnelInfo.localPort = localPort
        tunnelInfo.dstHost = dstHost
        tunnelInfo.dstPort = dstPort
        tunnelInfo.status = 'active'
        tunnelInfo.lastUsed = Date.now()
        delete tunnelInfo.creationPromise // Remove the promise once created
      } else {
        // If tunnel was deleted while creating, close resources
        this.closeServer(server, sshClient)
        return
      }

      console.log(`SSH tunnel established for ${id} to ${dstHost}:${dstPort} on local port ${localPort}`)
    } catch (error) {
      console.error(`Failed to create tunnel for ${id}:`, error)
      
      // Update tunnel status or remove it
      const tunnelInfo = this.tunnels.get(id)
      if (tunnelInfo) {
        tunnelInfo.status = 'error'
      }
      
      throw error
    }
  }

  // Helper method to close server and client
  private closeServer(server: Server, sshClient?: any): void {
    if (server) {
      try {
        server.removeAllListeners()
        server.close()
      } catch (e) {
        console.error('Error closing server:', e)
      }
    }
    
    if (sshClient && typeof sshClient.end === 'function') {
      try {
        sshClient.end()
      } catch (e) {
        console.error('Error ending SSH client:', e)
      }
    }
  }

  public async closeTunnel(id: string): Promise<void> {
    const tunnelInfo = this.tunnels.get(id)
    console.log(`Closing SSH tunnel for cluster ${id}`)
    
    if (!tunnelInfo) {
      console.log(`No tunnel found for cluster ${id}`)
      return Promise.resolve()
    }

    // Mark tunnel as being cleaned up
    if (tunnelInfo.status !== 'cleaning') {
      tunnelInfo.status = 'cleaning'
      this.cleaningTunnels.add(id)
    }

    // Remove from map immediately to prevent concurrent access
    this.tunnels.delete(id)

    return new Promise((resolve) => {
      try {
        // Remove all listeners from the server to prevent memory leaks
        if (tunnelInfo.server) {
          // Remove all listeners first
          tunnelInfo.server.removeAllListeners();
          
          if (tunnelInfo.tunnelInstance) {
            // In case the tunnelInstance has its own cleanup methods
            try {
              if (typeof tunnelInfo.tunnelInstance.end === 'function') {
                tunnelInfo.tunnelInstance.end();
              }
            } catch (e) {
              console.error(`Error ending tunnel instance for ${id}:`, e);
            }
          }
          
          // Now close the server if it's listening
          if (tunnelInfo.server.listening) {
            tunnelInfo.server.close(() => {
              console.log(`SSH tunnel closed and removed for cluster ${id}`)
              // Update port cache to show port is available again
              if (tunnelInfo.localPort) {
                this.portCache.set(tunnelInfo.localPort, true)
              }
              this.cleaningTunnels.delete(id) // Remove from cleaning set
              resolve()
            })
          } else {
            console.log(`SSH tunnel closed and removed for cluster ${id}`)
            this.cleaningTunnels.delete(id) // Remove from cleaning set
            resolve()
          }
        } else {
          console.log(`SSH tunnel closed and removed for cluster ${id}`)
          this.cleaningTunnels.delete(id) // Remove from cleaning set
          resolve()
        }
      } catch (error) {
        console.error(`Error during tunnel cleanup for cluster ${id}:`, error)
        this.cleaningTunnels.delete(id) // Remove from cleaning set in case of error
        resolve()
      }
    })
  }

  private async cleanupUnusedTunnels() {
    console.log("Running tunnel cleanup check...")
    const now = Date.now()
    const IDLE_TIMEOUT = 5 * 60 * 1000  // 5 minutes in milliseconds

    // 使用 Array.from 来避免迭代器问题
    const entries = Array.from(this.tunnels.entries())
    
    // Create cleanup tasks but don't wait for them
    for (const [id, tunnelInfo] of entries) {
      // Skip tunnels that are already being cleaned up
      if (this.cleaningTunnels.has(id)) {
        continue
      }
      
      const idleTime = now - tunnelInfo.lastUsed
      if (idleTime > IDLE_TIMEOUT && tunnelInfo.status === 'active') {
        console.log(`Tunnel ${id} has been idle for ${Math.round(idleTime / 1000)}s, cleaning up...`)
        // Don't await, let it run in the background
        this.closeTunnel(id).catch(err => {
          console.error(`Error while cleaning up idle tunnel ${id}:`, err)
          this.cleaningTunnels.delete(id) // Make sure to remove from cleaning set on error
        })
      }
    }
    
    // Clean port cache periodically to avoid memory leaks
    if (this.portCache.size > 100) {
      this.portCache.clear()
    }
  }

  public updateTunnelLastUsed(id: string) {
    const tunnelInfo = this.tunnels.get(id)
    if (tunnelInfo) {
      tunnelInfo.lastUsed = Date.now()
    }
  }

  public getTunnelStatus(id: string): boolean {
    const tunnel = this.tunnels.get(id)
    return !!tunnel && tunnel.status === 'active'
  }

  public getActualPort(id: string): number | null {
    const tunnelInfo = this.tunnels.get(id)
    if (!tunnelInfo || tunnelInfo.status !== 'active') {
      return null
    }
    
    // Use the stored local port directly if available
    if (tunnelInfo.localPort) {
      return tunnelInfo.localPort
    }
    
    // Fallback to server.address() method
    try {
      const address = tunnelInfo.server.address()
      if (typeof address === 'string' || !address) {
        return null
      }
      return address.port
    } catch (error) {
      console.error(`Error getting port for tunnel ${id}:`, error)
      return null
    }
  }

  // 清理所有资源
  public async cleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }

    // Reset cleaning tunnels set to ensure we don't skip any tunnels during final cleanup
    this.cleaningTunnels.clear()

    // 使用 Array.from 来避免迭代器问题
    const closePromises = []
    const ids = Array.from(this.tunnels.keys())
    for (const id of ids) {
      closePromises.push(this.closeTunnel(id))
    }
    
    // Wait for all tunnels to close in parallel
    await Promise.all(closePromises)

    // Clear caches and maps
    this.tunnels.clear()
    this.portCache.clear()
    this.cleaningTunnels.clear()

    // 移除事件监听器
    process.removeListener('SIGINT', this.exitHandler)
    process.removeListener('SIGTERM', this.exitHandler)
  }
}

export const tunnelManager = TunnelManager.getInstance()