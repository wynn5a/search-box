import * as cryptoModule from 'crypto'

const ENCRYPTION_KEY = cryptoModule.scryptSync(
  process.env.ENCRYPTION_KEY || 'your-fallback-encryption-key-min-32-chars!!',
  'salt',
  32
)
const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16

export function encrypt(text: string): string {
  const iv = cryptoModule.randomBytes(IV_LENGTH)
  const cipher = cryptoModule.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export function decrypt(text: string): string {
  const [ivHex, encryptedHex] = text.split(':')
  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid encrypted text format')
  }
  const iv = Buffer.from(ivHex, 'hex')
  const encryptedText = Buffer.from(encryptedHex, 'hex')
  const decipher = cryptoModule.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}
