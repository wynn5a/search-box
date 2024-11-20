import { ClusterSettings, SettingGroup } from "./types"

export function organizeSettings(settings: ClusterSettings): Record<string, SettingGroup> {
  const organized: Record<string, SettingGroup> = {}

  function addSetting(group: SettingGroup, path: string[], value: any, type: keyof ClusterSettings) {
    if (path.length === 0) return

    const [first, ...rest] = path
    if (rest.length === 0) {
      group.settings[path[0]] = value
    } else {
      if (!group.subgroups[first]) {
        group.subgroups[first] = {
          name: first,
          description: '',
          settings: {},
          subgroups: {}
        }
      }
      addSetting(group.subgroups[first], rest, value, type)
    }
  }

  function processSettings(settingsObj: Record<string, any> | null, type: keyof ClusterSettings) {
    if (!settingsObj) return

    Object.entries(settingsObj).forEach(([key, value]) => {
      const path = key.split('.')
      const [first] = path

      if (!organized[first]) {
        organized[first] = {
          name: first,
          description: '',
          settings: {},
          subgroups: {}
        }
      }

      addSetting(organized[first], path, value, type)
    })
  }

  processSettings(settings.persistent || {}, 'persistent')
  processSettings(settings.transient || {}, 'transient')
  processSettings(settings.defaults || {}, 'defaults')

  return organized
}

export function formatSettingKey(key: string | undefined) {
  if (!key) return ''
  return key.split('.').map(part =>
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join(' ')
}

export function getGroupDescription(path: string) {
  const descriptions: Record<string, string> = {
    'cluster': '集群基本设置',
    'cluster.routing': '路由设置',
    'cluster.routing.allocation': '分片分配设置',
    'discovery': '节点发现设置',
    'discovery.seed': '种子节点设置',
  }
  return descriptions[path] || `${formatSettingKey(path.split('.').pop() || '')}相关设置`
}
