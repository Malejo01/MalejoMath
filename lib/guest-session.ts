/**
 * Guest sessions for students who join an aula without a Google account.
 *
 * A guest is a real row in `users` (is_guest = true, email NULL) so every
 * existing foreign key — quiz_attempts, topic_mastery, student tips — keeps
 * working with zero special-casing. What identifies them across requests is
 * this cookie: the user id plus an HMAC of it, signed with AUTH_SECRET.
 *
 * Web Crypto (not node:crypto) so the same helpers work in Route Handlers and,
 * if needed later, in edge middleware.
 */
const GUEST_COOKIE_NAME = 'maestria_guest'

/** Six months — long enough that a student's term doesn't outlive their session. */
const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 180

export { GUEST_COOKIE_NAME, GUEST_COOKIE_MAX_AGE }

function getSecret(): string {
  // Same fallback chain as auth.ts, so both signatures live or die together.
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'maestria-fallback-secret-key-2026'
}

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return toBase64Url(signature)
}

/** Constant-time-ish comparison; avoids leaking signature bytes via early exit. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export function newGuestId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `guest_${hex}`
}

export async function signGuestToken(guestId: string): Promise<string> {
  return `${guestId}.${await sign(guestId)}`
}

/** Returns the guest id when the signature checks out, null otherwise. */
export async function verifyGuestToken(token: string | undefined | null): Promise<string | null> {
  if (!token) return null

  const separator = token.lastIndexOf('.')
  if (separator <= 0) return null

  const guestId = token.slice(0, separator)
  const signature = token.slice(separator + 1)
  if (!guestId.startsWith('guest_')) return null

  return safeEqual(await sign(guestId), signature) ? guestId : null
}

export function guestCookieOptions(maxAge: number = GUEST_COOKIE_MAX_AGE) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  }
}
