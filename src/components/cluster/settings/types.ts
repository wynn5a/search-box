export interface ClusterSettings {
  persistent: Record<string, any> | null
  transient: Record<string, any> | null
  defaults: Record<string, any> | null
}

export interface SettingGroup {
  name: string
  description: string
  settings: Record<string, any>
  subgroups: Record<string, SettingGroup>
}

export interface SettingHistoryItem {
  term: string
  timestamp: number
}

export interface SettingEditState {
  path: string[]
  value: any
  type: 'persistent' | 'transient'
  isOpen: boolean
}

export type SettingType = 'persistent' | 'transient' | 'defaults'
