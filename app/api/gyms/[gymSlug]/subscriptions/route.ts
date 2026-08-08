import { NextResponse } from 'next/server'
import { getGymContextApi } from '@/lib/gym-context'
import { getSubscriptions } from '@/lib/queries'
import { prisma } from '@/lib/prisma'
import { auditFromRequest } from '@/lib/audit'

// GET /api/gyms/[gymSlug]/subscriptions
export async function GET(
  request: Request,
  { params }: { params: Promise<{ gymSlug: string }> }
) {
  const { gymSlug } = await params
  const ctxResult = await getGymContextApi(gymSlug)
  if (!ctxResult.ok) {
    return NextResponse.json({ error: ctxResult.error }, { status: ctxResult.status })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || undefined
  const status = (searchParams.get('status') as any) || 'all'
  const page = parseInt(searchParams.get('page') || '1')

  const result = await getSubscriptions(ctxResult.ctx.gym.id, { search, status, page })
  return NextResponse.json(result)
}

// POST /api/gyms/[gymSlug]/subscriptions — create/renew a subscription
export async function POST(
  request: Request,
  { params }: { params: Promise<{ gymSlug: string }> }
) {
  const { gymSlug } = await params
  const ctxResult = await getGymContextApi(gymSlug)
  if (!ctxResult.ok) {
    return NextResponse.json({ error: ctxResult.error }, { status: ctxResult.status })
  }
  const { gym, userId } = ctxResult.ctx

  const body = await request.json()
  const { memberId, planId, startDate, discount, method, notes } = body

  // Validate member belongs to gym
  const member = await prisma.member.findFirst({
    where: { id: memberId, gymId: gym.id },
  })
  if (!member) {
    return NextResponse.json({ error: 'العضو غير موجود' }, { status: 404 })
  }

  // Validate plan belongs to gym
  const plan = await prisma.gymPlan.findFirst({
    where: { id: planId, gymId: gym.id },
  })
  if (!plan) {
    return NextResponse.json({ error: 'الخطة غير موجودة' }, { status: 404 })
  }

  const start = startDate ? new Date(startDate) : new Date()
  const end = new Date(start)
  end.setDate(end.getDate() + plan.duration)

  const finalDiscount = discount || 0
  const finalPrice = plan.price - finalDiscount

  // Transaction: create subscription + payment
  const result = await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.create({
      data: {
        gymId: gym.id,
        memberId,
        planId,
        startDate: start,
        endDate: end,
        price: plan.price,
        discount: finalDiscount,
        finalPrice,
        status: 'active',
        notes,
        createdBy: userId,
      },
    })

    const payment = await tx.payment.create({
      data: {
        gymId: gym.id,
        memberId,
        subscriptionId: subscription.id,
        amount: plan.price,
        discount: finalDiscount,
        finalAmount: finalPrice,
        method: method || 'cash',
        status: 'paid',
        notes: `اشتراك ${plan.name} - ${member.fullName}`,
        createdBy: userId,
      },
    })

    return { subscription, payment }
  })

  void auditFromRequest(request, gym.id, userId, 'subscription.create', 'subscription', result.subscription.id, {
    memberName: member.fullName,
    planName: plan.name,
    amount: finalPrice,
  })

  return NextResponse.json({ success: true, ...result }, { status: 201 })
}
