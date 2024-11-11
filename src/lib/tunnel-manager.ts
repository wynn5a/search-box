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

class TunnelManager {
  private static instance: TunnelManager
  private tunnels: Map<string, Server> = new Map()

  private constructor() {}

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
    if (this.tunnels.has(clusterId)) {
      await this.closeTunnel(clusterId)
    }

    const localPort = await this.getAvailablePort(config.localPort)

    return new Promise((resolve, reject) => {
      const server = createServer(async (connection) => {
        const ssh = new Client()

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
              })
            }
          )
        })

        ssh.on('error', (err) => {
          console.error(`SSH connection error for cluster ${clusterId}:`, err)
          connection.end()
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
        reject(err)
      })

      server.listen(localPort, '127.0.0.1', () => {
        console.log(`SSH tunnel created for cluster ${clusterId} on port ${localPort}`)
        this.tunnels.set(clusterId, server)
        resolve(server)
      })
    })
  }

  public async closeTunnel(clusterId: string): Promise<void> {
    const server = this.tunnels.get(clusterId)
    if (server) {
      return new Promise((resolve) => {
        server.close(() => {
          this.tunnels.delete(clusterId)
          console.log(`SSH tunnel closed for cluster ${clusterId}`)
          resolve()
        })
      })
    }
  }

  public getTunnelStatus(clusterId: string): boolean {
    return this.tunnels.has(clusterId)
  }
}

export const tunnelManager = TunnelManager.getInstance()