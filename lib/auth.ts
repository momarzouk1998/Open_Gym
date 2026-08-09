import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { authConfig } from '../auth.config'
import { rateLimit } from './rate-limit'

/**
 * Full NextAuth config (Node runtime).
 *
 * Extends the edge-safe authConfig (from auth.config.ts) by adding:
 *  - the Credentials provider (requires bcrypt + Prisma — Node-only)
 *  - the jwt callback that enriches the token with role/gymId from the DB
 *
 * The cookie names + session callback are inherited unchanged from authConfig so that
 * the middleware (edge) and the API routes (node) agree on how to read the session.
 */
import { consumeImpersonationToken } from './impersonation'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'البريد الإلكتروني', type: 'email' },
        password: { label: 'كلمة المرور', type: 'password' },
        impersonationToken: { label: 'رمز الانتحال', type: 'text' },
      },
      async authorize(credentials) {
        // Handle Super Admin Impersonation
        if (credentials?.impersonationToken) {
          const userId = consumeImpersonationToken(credentials.impersonationToken as string)
          if (userId) {
            const user = await prisma.user.findUnique({ where: { id: userId } })
            if (user) {
              return { id: user.id, email: user.email, name: user.name }
            }
          }
          return null
        }

        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Rate limit: max 10 login attempts per email per 15 minutes
        const emailKey = `login:${(credentials.email as string).toLowerCase()}`
        const rl = rateLimit(emailKey, { limit: 10, windowSecs: 900 })
        if (!rl.allowed) {
          // Throw so NextAuth surfaces the error to the client
          throw new Error(`محاولات كثيرة. حاول بعد ${rl.retryAfter} ثانية.`)
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user) return null

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password || ''
        )

        if (!isPasswordValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  callbacks: {
    // Enrich the JWT with role + gymId at sign-in (runs once, in Node runtime).
    async jwt({ token, user }) {
      if (user) {
        const profile = await prisma.profile.findUnique({
          where: { id: user.id },
        })
        if (profile) {
          token.role = profile.role
          token.gymId = profile.gymId
        }
      }
      return token
    },
    // Inherited pass-through session callback (same as authConfig — keep them in sync).
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
        session.user.gymId = token.gymId as string | null
      }
      return session
    },
  },
})
