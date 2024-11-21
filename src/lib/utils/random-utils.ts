"use client"

const SAMPLE_WORDS = [
  "apple", "banana", "cherry", "date", "elderberry",
  "fig", "grape", "honeydew", "kiwi", "lemon",
  "mango", "nectarine", "orange", "papaya", "quince",
  "raspberry", "strawberry", "tangerine", "ugli", "watermelon",
  "开发", "测试", "生产", "部署", "监控",
  "数据", "分析", "报告", "统计", "查询",
  "用户", "系统", "服务", "接口", "配置",
  "模块", "功能", "性能", "安全", "备份"
]

const SAMPLE_NAMES = [
  "张三", "李四", "王五", "赵六",
  "John", "Jane", "Mike", "Sarah",
  "Alice", "Bob", "Charlie", "David"
]

const SAMPLE_EMAILS = [
  "user1@example.com", "user2@example.com",
  "test@company.com", "admin@system.com",
  "support@service.com", "info@business.com"
]

const SAMPLE_IPS = [
  "192.168.1.1", "10.0.0.1", "172.16.0.1",
  "192.168.0.100", "10.0.0.50", "172.16.0.25"
]

const SAMPLE_URLS = [
  "https://example.com",
  "https://api.service.com",
  "https://docs.system.com",
  "https://portal.company.com"
]

export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function getRandomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function getRandomWord(): string {
  return SAMPLE_WORDS[Math.floor(Math.random() * SAMPLE_WORDS.length)]
}

export function getRandomWords(count: number = 3): string {
  const words: string[] = []
  for (let i = 0; i < count; i++) {
    words.push(getRandomWord())
  }
  return words.join(" ")
}

export function getRandomName(): string {
  return SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)]
}

export function getRandomEmail(): string {
  return SAMPLE_EMAILS[Math.floor(Math.random() * SAMPLE_EMAILS.length)]
}

export function getRandomIP(): string {
  return SAMPLE_IPS[Math.floor(Math.random() * SAMPLE_IPS.length)]
}

export function getRandomURL(): string {
  return SAMPLE_URLS[Math.floor(Math.random() * SAMPLE_URLS.length)]
}

export function getRandomDate(start?: Date, end?: Date): string {
  const startDate = start || new Date(2020, 0, 1)
  const endDate = end || new Date()
  const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()))
  return randomDate.toISOString()
}

export function getRandomBoolean(): boolean {
  return Math.random() > 0.5
}

export function getRandomVersion(): string {
  return `${getRandomInt(0, 5)}.${getRandomInt(0, 9)}.${getRandomInt(0, 9)}`
}

export function getRandomStatus(): string {
  const statuses = ["active", "inactive", "pending", "completed", "failed"]
  return statuses[Math.floor(Math.random() * statuses.length)]
}

export function getRandomTags(): string[] {
  const tags = ["开发", "测试", "生产", "重要", "紧急", "普通", "dev", "test", "prod"]
  const count = getRandomInt(1, 3)
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    const tag = tags[Math.floor(Math.random() * tags.length)]
    if (!result.includes(tag)) {
      result.push(tag)
    }
  }
  return result
}
