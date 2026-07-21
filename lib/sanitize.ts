/**
 * Lightweight HTML sanitizer that escapes dangerous HTML entities.
 * Uses no Node.js-specific dependencies — works in Edge/Workers environments.
 */
const DANGEROUS_HTML_RE = /[<&>"']/g
const ESCAPE_MAP: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  '"': "&quot;",
  "'": "&#x27;",
}

export function sanitizeUserInput(input: string): string {
  if (typeof input !== "string") {
    return String(input)
  }
  return input.replace(DANGEROUS_HTML_RE, (char) => ESCAPE_MAP[char] || char)
}