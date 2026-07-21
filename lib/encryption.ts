const ALGORITHM = "AES-GCM"

let cachedKey: CryptoKey | null = null

async function getKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is required")
  }
  const keyBytes = Uint8Array.from(atob(ENCRYPTION_KEY), (c) => c.charCodeAt(0))
  if (keyBytes.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be 32 bytes long")
  }
  cachedKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: ALGORITHM },
    false,
    ["encrypt", "decrypt"]
  )
  return cachedKey
}

export async function encryptKey(plaintext: string): Promise<{
  encrypted: string
  iv: string
}> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  )

  const authTag = new Uint8Array(cipherBuffer).slice(-16)
  const encrypted = new Uint8Array(cipherBuffer).slice(0, -16)

  // Combine encrypted + authTag as hex
  const combined = new Uint8Array(encrypted.length + authTag.length)
  combined.set(encrypted)
  combined.set(authTag, encrypted.length)

  const encryptedHex = Array.from(combined)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  return {
    encrypted: encryptedHex,
    iv: Array.from(iv)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
  }
}

export async function decryptKey(
  encryptedData: string,
  ivHex: string
): Promise<string> {
  const key = await getKey()
  const iv = new Uint8Array(
    ivHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16))
  )

  const combined = new Uint8Array(
    encryptedData.match(/.{1,2}/g)!.map((b) => parseInt(b, 16))
  )

  // Last 16 bytes are the auth tag
  const authTag = combined.slice(-16)
  const encrypted = combined.slice(0, -16)

  // Re-combine for Web Crypto (it expects ciphertext + tag concatenated)
  const cipherBuffer = new Uint8Array(encrypted.length + authTag.length)
  cipherBuffer.set(encrypted)
  cipherBuffer.set(authTag, encrypted.length)

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    cipherBuffer
  )

  return new TextDecoder().decode(decrypted)
}

export function maskKey(key: string): string {
  if (key.length <= 8) {
    return "*".repeat(key.length)
  }
  return key.slice(0, 4) + "*".repeat(key.length - 8) + key.slice(-4)
}