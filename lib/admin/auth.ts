import { cookies } from "next/headers"

const ADMIN_COOKIE_NAME = "zola_admin_session"
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

export function getAdminPassword(): string {
  const pwd = process.env.ADMIN_PASSWORD
  if (!pwd) {
    console.warn("ADMIN_PASSWORD is not set. Using default is not secure. Set ADMIN_PASSWORD env var.")
    return "admin123"
  }
  return pwd
}

/**
 * Creates an HMAC-SHA256 signed admin token.
 * Format: "zola-admin-{timestamp}:{signature}"
 * Works in stateless environments (Cloudflare Pages, serverless) because
 * verification only needs ADMIN_PASSWORD (env var), not in-memory state.
 */
async function createSignedToken(): Promise<string> {
  const timestamp = Date.now().toString(36)
  const secret = getAdminPassword()

  const data = new TextEncoder().encode(`zola-admin-${timestamp}`)
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const signature = await crypto.subtle.sign("HMAC", key, data)
  const sigHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  return `zola-admin-${timestamp}:${sigHex}`
}

async function verifySignedToken(token: string): Promise<boolean> {
  try {
    const secret = getAdminPassword()

    const separatorIndex = token.lastIndexOf(":")
    if (separatorIndex === -1) return false

    const prefix = token.substring(0, separatorIndex)
    const providedSig = token.substring(separatorIndex + 1)

    // Check expiry
    const timestampMatch = prefix.match(/^zola-admin-([a-z0-9]+)$/)
    if (!timestampMatch) return false

    const timestamp = parseInt(timestampMatch[1], 36)
    if (Date.now() - timestamp > TOKEN_EXPIRY_MS) return false

    // Verify signature
    const data = new TextEncoder().encode(prefix)
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    )

    const sigBytes = new Uint8Array(
      providedSig.match(/.{1,2}/g)!.map((b) => parseInt(b, 16))
    )

    return await crypto.subtle.verify("HMAC", key, sigBytes, data)
  } catch {
    return false
  }
}

export async function verifyAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get(ADMIN_COOKIE_NAME)?.value
    if (!session) return false

    return await verifySignedToken(session)
  } catch {
    return false
  }
}

export async function createAdminToken(): Promise<string> {
  return await createSignedToken()
}

export { ADMIN_COOKIE_NAME }