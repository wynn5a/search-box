import { PrismaClient } from '@prisma/client'
import { encrypt } from '../src/lib/utils/crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting password encryption...')

  // 获取所有集群
  const clusters = await prisma.cluster.findMany({
    where: {
      OR: [
        { password: { not: null } },
        { sshPassword: { not: null } }
      ]
    }
  })

  console.log(`Found ${clusters.length} clusters with passwords to encrypt`)

  // 更新每个集群的密码
  for (const cluster of clusters) {
    console.log(`Processing cluster: ${cluster.name}`)
    
    try {
      // 只加密非空且未加密的密码
      const updates: { password?: string; sshPassword?: string } = {}
      
      if (cluster.password && !cluster.password.includes(':')) {
        updates.password = encrypt(cluster.password)
      }
      
      if (cluster.sshPassword && !cluster.sshPassword.includes(':')) {
        updates.sshPassword = encrypt(cluster.sshPassword)
      }

      // 如果有需要更新的字段
      if (Object.keys(updates).length > 0) {
        await prisma.cluster.update({
          where: { id: cluster.id },
          data: updates
        })
        console.log(`Successfully encrypted passwords for cluster: ${cluster.name}`)
      } else {
        console.log(`No passwords need encryption for cluster: ${cluster.name}`)
      }
    } catch (error) {
      console.error(`Error encrypting passwords for cluster ${cluster.name}:`, error)
    }
  }

  console.log('Password encryption completed')
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
