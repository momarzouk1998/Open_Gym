/**
 * Member session tokens — a lightweight, edge-safe signed cookie session for the
 * member-facing portal (member-login / member/dashboard / self check-in).
 *
 * Members are NOT NextAuth users (they live in the `Member` table, not `User`), so they
 * can't use next-auth's session. Previously the member portal had NO server-side session
 * at all: /api/member/login just returned member data for the client to keep in
 * localStorage, and every other member endpoint (change-password, attendance) trusted a
 * client-supplied `memberId` with no verification — anyone could act as any member by
 * guessing/reading an id. This module fixes that with a signed HMAC token, verifiable in
 * both the edge middleware and node route handlers (Web Crypto works in both runtimes).
 */

export const MEMBER_SESSION_COOKIE = 'member_session'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function getSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not set')
  return secret
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

function bytesToBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''
  for (const b of arr) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(str: string): Uint8Array<ArrayBuffer> {
  const normalized = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const arr = new Uint8Array(new ArrayBuffer(binary.length))
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
  return arr
}

export interface MemberSessionPayload {
  memberId: string
  gymId: string
  exp: number
}

const THIRTY_DAYS_SECS = 60 * 60 * 24 * 30

export async function createMemberSessionToken(
  memberId: string,
  gymId: string,
  ttlSeconds: number = THIRTY_DAYS_SECS
): Promise<string> {
  const payload: MemberSessionPayload = {
    memberId,
    gymId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  }
  const payloadB64 = bytesToBase64Url(encoder.encode(JSON.stringify(payload)))
  const key = await hmacKey()
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadB64))
  return `${payloadB64}.${bytesToBase64Url(signature)}`
}

export async function verifyMemberSessionToken(
  token: string | undefined | null
): Promise<MemberSessionPayload | null> {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [payloadB64, sigB64] = parts

  try {
    const key = await hmacKey()
    const signature = base64UrlToBytes(sigB64)
    const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(payloadB64))
    if (!valid) return null

    const payload = JSON.parse(decoder.decode(base64UrlToBytes(payloadB64))) as MemberSessionPayload
    if (!payload?.memberId || !payload?.gymId || !payload?.exp) return null
    if (payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}

function readCookieFromHeader(cookieHeader: string, name: string): string | null {
  const parts = cookieHeader.split(';')
  for (const part of parts) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

/** Reads and verifies the member session cookie from a raw Request (route handlers). */
export async function getMemberSessionFromRequest(
  request: Request
): Promise<MemberSessionPayload | null> {
  const cookieHeader = request.headers.get('cookie') || ''
  const token = readCookieFromHeader(cookieHeader, MEMBER_SESSION_COOKIE)
  return verifyMemberSessionToken(token)
}

export function memberSessionCookieOptions(maxAgeSeconds: number = THIRTY_DAYS_SECS) {
  const isProd = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  }
}
