import { NextResponse } from 'next/server'
import { getGymContextApi } from '@/lib/gym-context'
import { getGymPlans } from '@/lib/queries'
import { prisma } from '@/lib/prisma'
import { auditFromRequest } from '@/lib/audit'

// GET /api/gyms/[gymSlug]/plans
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

  const plans = await getGymPlans(gym.id)
  return NextResponse.json(plans)
}

// POST /api/gyms/[gymSlug]/plans — create a plan
export async function POST(
  request: Request,
  { params }: { params: Promise<{ gymSlug: string }> }
) {
  const { gymSlug } = await params
  const ctxResult = await getGymContextApi(gymSlug)
  if (!ctxResult.ok) {
    return NextResponse.json({ error: ctxResult.error }, { status: ctxResult.status })
  }
  const { gym, role, userId } = ctxResult.ctx

  // Only owner/manager can create plans
  if (role === 'cashier' || role === 'trainer') {
    return NextResponse.json({ error: 'لا تملك صلاحية الإضافة' }, { status: 403 })
  }

  const body = await request.json()
  const { name, duration, price } = body

  if (!name?.trim() || !duration || price === undefined) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
  }

  const plan = await prisma.gymPlan.create({
    data: {
      gymId: gym.id,
      name: name.trim(),
      duration: parseInt(duration),
      price: parseFloat(price),
    },
  })

  void auditFromRequest(request, gym.id, userId, 'plan.create', 'gymPlan', plan.id, {
    name: plan.name,
    duration: plan.duration,
    price: plan.price,
  })

  return NextResponse.json({ success: true, plan }, { status: 201 })
}
