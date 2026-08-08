import { NextResponse } from 'next/server'
import { getGymContextApi } from '@/lib/gym-context'
import { getExpiringSubscriptions, getExpiredSubscriptions } from '@/lib/queries'
import { prisma } from '@/lib/prisma'

// GET /api/gyms/[gymSlug]/expiring
// Returns subscriptions expiring within 7 days + already expired, with member phone
// for WhatsApp reminders. Optional ?days=N to widen the expiring window.
// Also auto-updates stale 'active' subscriptions whose endDate has passed to 'expired'.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ gymSlug: string }> }
) {
  const { gymSlug } = await params
  const ctxResult = await getGymContextApi(gymSlug)
  if (!ctxResult.ok) {
    return NextResponse.json({ error: ctxResult.error }, { status: ctxResult.status })
  }
  const { gym } = ctxResult.ctx

  // Auto-update stale subscriptions: any 'active' sub whose endDate < now → 'expired'
  await prisma.subscription.updateMany({
    where: {
      gymId: gym.id,
      status: 'active',
      endDate: { lt: new Date() },
    },
    data: { status: 'expired' },
  })

  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '7')

  const [expiring, expired] = await Promise.all([
    getExpiringSubscriptions(gym.id, days),
    getExpiredSubscriptions(gym.id),
  ])

  return NextResponse.json({ expiring, expired })
}
