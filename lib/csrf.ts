import { cookies } from "next/headers"

const CSRF_SECRET = process.env.CSRF_SECRET

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function generateCsrfToken(): Promise<string> {
  const raw = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  const token = await sha256(`${raw}${CSRF_SECRET}`)
  return `${raw}:${token}`
}

export async function validateCsrfToken(fullToken: string): Promise<boolean> {
  const [raw, token] = fullToken.split(":")
  if (!raw || !token) return false
  const expected = await sha256(`${raw}${CSRF_SECRET}`)
  return expected === token
}

export async function setCsrfCookie() {
  const cookieStore = await cookies()
  const token = await generateCsrfToken()
  cookieStore.set("csrf_token", token, {
    httpOnly: false,
    secure: true,
    path: "/",
  })
}