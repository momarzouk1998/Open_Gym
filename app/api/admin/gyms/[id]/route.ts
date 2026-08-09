import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { VALID_PLAN_PRICES, getAddonsForPlan, getPlanByPrice } from '@/lib/billing'
import type { AddonKey, GymStatus, BillingCycle } from '@prisma/client'

// GET /api/admin/gyms/[id] — single gym detail for super_admin
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'غير مسجّل الدخول' }, { status: 401 })
  }
  if (session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'ممنوع' }, { status: 403 })
  }

  const { id } = await params
  const gym = await prisma.gym.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      ownerName: true,
      ownerEmail: true,
      ownerPhone: true,
      phone: true,
      city: true,
      address: true,
      status: true,
      basePlanPrice: true,
      addons: true,
      billingCycle: true,
      nextBillingDate: true,
      lastPaidAt: true,
      createdAt: true,
    },
  })

  if (!gym) {
    return NextResponse.json({ error: 'الجيم غير موجود' }, { status: 404 })
  }

  return NextResponse.json({ gym })
}

// PATCH /api/admin/gyms/[id] — super_admin edits a gym's plan/addons/status/billing
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'غير مسجّل الدخول' }, { status: 401 })
  }
  if (session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'ممنوع' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { basePlanPrice, addons, status, billingCycle, nextBillingDate } = body

  // Validate plan price against billing.ts (single source of truth)
  if (basePlanPrice !== undefined) {
    if (typeof basePlanPrice !== 'number' || !VALID_PLAN_PRICES.includes(basePlanPrice)) {
      return NextResponse.json(
        { error: `سعر الباقة غير صالح. الأسعار المتاحة: ${VALID_PLAN_PRICES.join('، ')} ج` },
        { status: 400 }
      )
    }
  }

  // If plan changes but addons not explicitly provided, auto-assign correct addons:
  // Pro → all addons. Starter → clear addons (admin can override by passing addons explicitly).
  let resolvedAddons: AddonKey[] | undefined = addons !== undefined ? (addons as AddonKey[]) : undefined
  if (basePlanPrice !== undefined && addons === undefined) {
    const planKey = getPlanByPrice(basePlanPrice)
    if (planKey) {
      resolvedAddons = getAddonsForPlan(planKey) as AddonKey[]
    }
  }

  // Validate status enum if provided
  if (status !== undefined) {
    const validStatuses: GymStatus[] = ['active', 'trial', 'suspended', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 })
    }
  }

  // Validate billing cycle if provided
  if (billingCycle !== undefined) {
    const validCycles: BillingCycle[] = ['monthly', 'quarterly', 'annual']
    if (!validCycles.includes(billingCycle)) {
      return NextResponse.json({ error: 'دورة فاتورة غير صالحة' }, { status: 400 })
    }
  }

  const updated = await prisma.gym.update({
    where: { id },
    data: {
      ...(basePlanPrice !== undefined && { basePlanPrice }),
      ...(resolvedAddons !== undefined && { addons: resolvedAddons }),
      ...(status !== undefined && { status: status as GymStatus }),
      ...(billingCycle !== undefined && { billingCycle: billingCycle as BillingCycle }),
      ...(nextBillingDate !== undefined && {
        nextBillingDate: nextBillingDate ? new Date(nextBillingDate) : null,
      }),
    },
    select: {
      id: true,
      name: true,
      basePlanPrice: true,
      addons: true,
      status: true,
      billingCycle: true,
      nextBillingDate: true,
    },
  })

  return NextResponse.json({ success: true, gym: updated })
}

// DELETE /api/admin/gyms/[id] — super_admin deletes a gym
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'غير مسجّل الدخول' }, { status: 401 })
  }
  if (session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'ممنوع' }, { status: 403 })
  }

  const { id } = await params

  try {
    await prisma.gym.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting gym:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الجيم. قد توجد بيانات مرتبطة تمنع الحذف.' },
      { status: 500 }
    )
  }
}
