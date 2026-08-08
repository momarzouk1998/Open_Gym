import { NextResponse } from 'next/server'
import { getGymContextApi } from '@/lib/gym-context'
import { getDashboardStats, getRevenueChart, getExpiringSubscriptions } from '@/lib/queries'

// GET /api/gyms/[gymSlug]/dashboard
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

  const { searchParams } = new URL(request.url)
  const months = parseInt(searchParams.get('months') || '6')

  // Skip revenue chart DB queries during trial — the chart is hidden in the UI anyway.
  // This saves 6 payment aggregate queries per dashboard load for trial gyms.
  const isTrial = gym.status === 'trial'

  const [stats, revenueChart, expiringSoon] = await Promise.all([
    getDashboardStats(gym.id),
    isTrial ? Promise.resolve([]) : getRevenueChart(gym.id, months),
    getExpiringSubscriptions(gym.id, 7),
  ])

  return NextResponse.json({ stats, revenueChart, expiringSoon })
}
