import { ClusterOverview } from "./cluster"

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface ClusterSummary {
  totalClusters: number
  healthyClusters: number
  unhealthyClusters: number
  totalIndices: number
  totalStorage: number
  shards: {
    total: number
    active: number
    relocating: number
    initializing: number
    unassigned: number
  }
}
