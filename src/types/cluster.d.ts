export interface ClusterHealth {
  status: string
  number_of_nodes: number
  active_shards: number
  relocating_shards: number
  initializing_shards: number
  unassigned_shards: number
}

export interface ClusterStats {
  indices: {
    count: number
    docs: {
      count: number
    }
    store: {
      size_in_bytes: number
      total_data_set_size_in_bytes: number
    }
  }
}

export interface ClusterConfig {
  id: string
  name: string
  url: string
  username: string | null
  password: string | null
  isDefault: boolean
  sshEnabled: boolean
  sshHost: string | null
  sshPort: number | null
  sshUser: string | null
  sshPassword: string | null
  sshKeyFile: string | null
  localPort: number | null
  remoteHost: string | null
  remotePort: number | null
  createdAt: Date
  updatedAt: Date
  lastConnected: Date | null
}

export interface ClusterOverview extends ClusterConfig {
  health: ClusterHealth
  stats: ClusterStats
}
