export interface ClusterConfig {
  id: string
  name: string
  url: string
  username?: string
  password?: string
  sshEnabled: boolean
  sshHost?: string
  sshPort?: number
  sshUser?: string
  sshPassword?: string
  sshKeyFile?: string
  localPort?: number
  remoteHost?: string
  remotePort?: number
  createdAt: Date
  updatedAt: Date
} 