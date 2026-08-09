// Simple in-memory token store for 5-minute single-use Super Admin impersonation tokens
const impersonationTokens = new Map<string, { userId: string; expiresAt: number }>()

export function createImpersonationToken(userId: string): string {
  const token = `imp_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`
  impersonationTokens.set(token, {
    userId,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes validity
  })
  return token
}

export function consumeImpersonationToken(token: string): string | null {
  const data = impersonationTokens.get(token)
  if (!data) return null
  impersonationTokens.delete(token)
  if (Date.now() > data.expiresAt) return null
  return data.userId
}
