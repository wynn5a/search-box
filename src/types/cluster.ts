export interface ClusterConfig {
  id: string
  name: string
  url: string
  username?: string | null
  password?: string | null
  sshEnabled: boolean
  sshHost?: string | null
  sshPort?: number | null
  sshUser?: string | null
  sshPassword?: string | null
  sshKeyFile?: string | null
  localPort?: number | null
  remoteHost?: string | null
  remotePort?: number | null
  createdAt: Date
  updatedAt: Date
}