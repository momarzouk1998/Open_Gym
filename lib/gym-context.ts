import { redirect } from 'next/navigation'
import { auth } from './auth'
import { prisma } from './prisma'
import type { Gym, User } from '@prisma/client'

export interface GymContext {
  gym: Gym
  userId: string
  role: string
  isOwner: boolean
}

/**
 * Core security guard for path-based multi-tenancy.
 *
 * Given a gymSlug from the URL, this:
 * 1. Requires an authenticated session
 * 2. Loads the gym by slug
 * 3. Verifies the user owns the gym (or is super_admin)
 * 4. Returns the authorized context
 *
 * Call this at the top of EVERY server component / route handler
 * that operates on a single gym's data.
 */
export async function getGymContext(
  gymSlug: string
): Promise<GymContext> {
  // 1. Auth check
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const userId = session.user.id
  const role = session.user.role || 'gym_owner'

  // 2. Load gym
  const decodedSlug = decodeURIComponent(gymSlug)
  const gym = await prisma.gym.findFirst({
    where: {
      OR: [
        { slug: gymSlug },
        { slug: decodedSlug },
      ],
    },
  })

  if (!gym) {
    // Gym doesn't exist — send to dashboard selector
    redirect('/dashboard?error=gym_not_found')
  }

  // 3. Access check
  if (role === 'super_admin') {
    return { gym, userId, role, isOwner: false }
  }

  // Gym owner: check that this user's profile belongs to this gym
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { gymId: true, role: true },
  })

  const hasAccess = profile?.gymId === gym.id
  if (!hasAccess) {
    // Not their gym — redirect to their own
    redirect('/dashboard?error=no_access')
  }

  return {
    gym,
    userId,
    role: profile?.role || role,
    isOwner: profile?.role === 'gym_owner',
  }
}

/**
 * API variant — returns null + error code instead of redirecting.
 * Use in route handlers so they can return proper HTTP status codes.
 */
export async function getGymContextApi(
  gymSlug: string
): Promise<{ ok: true; ctx: GymContext } | { ok: false; status: number; error: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, status: 401, error: 'غير مسجّل الدخول' }
  }

  const userId = session.user.id
  const role = session.user.role || 'gym_owner'

  const decodedSlug = decodeURIComponent(gymSlug)
  const gym = await prisma.gym.findFirst({
    where: {
      OR: [
        { slug: gymSlug },
        { slug: decodedSlug },
      ],
    },
  })

  if (!gym) {
    return { ok: false, status: 404, error: 'الجيم غير موجود' }
  }

  if (role === 'super_admin') {
    return { ok: true, ctx: { gym, userId, role, isOwner: false } }
  }

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { gymId: true },
  })

  if (profile?.gymId !== gym.id) {
    return { ok: false, status: 403, error: 'لا تملك صلاحية الوصول لهذا الجيم' }
  }

  return { ok: true, ctx: { gym, userId, role, isOwner: true } }
}

/**
 * Get all gyms a user has access to (for the switcher + auto-redirect).
 * For super_admin: supports pagination via page/pageSize params.
 * For gym owners: returns their single gym (no pagination needed).
 */
export async function getUserGyms(
  userId: string,
  role: string,
  options?: { page?: number; pageSize?: number }
) {
  if (role === 'super_admin') {
    const page = options?.page || 1
    const pageSize = options?.pageSize || 20
    const gymSelect = { id: true, name: true, slug: true, logoUrl: true, status: true, addons: true, trialEndsAt: true, basePlanPrice: true }

    const [gyms, total] = await Promise.all([
      prisma.gym.findMany({
        orderBy: { createdAt: 'desc' },
        select: gymSelect,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.gym.count(),
    ])

    return { gyms, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
  }

  // Gym owners/managers — find their gym via profile
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { gymId: true },
  })

  if (!profile?.gymId) return { gyms: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }

  const gyms = await prisma.gym.findMany({
    where: { id: profile.gymId },
    select: { id: true, name: true, slug: true, logoUrl: true, status: true, addons: true, trialEndsAt: true, basePlanPrice: true },
  })

  return { gyms, total: gyms.length, page: 1, pageSize: 20, totalPages: 1 }
}
