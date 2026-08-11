import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { VALID_PLAN_PRICES, getAddonsForPlan, getPlanByPrice } from '@/lib/billing'
import type { AddonKey, GymStatus, BillingCycle } from '@prisma/client'

// Helper to find gym by id OR slug OR decoded slug with safe fallback if schema column is updating
async function findGymByIdOrSlug(rawId: string) {
  const decodedId = decodeURIComponent(rawId)
  const whereClause = {
    OR: [
      { id: rawId },
      { id: decodedId },
      { slug: rawId },
      { slug: decodedId },
    ],
  }

  try {
    return await prisma.gym.findFirst({
      where: whereClause,
      include: {
        _count: {
          select: {
            members: true,
            subscriptions: true,
            branches: true,
          },
        },
      },
    })
  } catch (err) {
    console.warn('Full findFirst failed, trying fallback select:', err)
    // Fallback select excluding broadcastBanner if column is not created yet
    return await prisma.gym.findFirst({
      where: whereClause,
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
        trialEndsAt: true,
        lastPaidAt: true,
        createdAt: true,
        adminNotes: true,
        _count: {
          select: {
            members: true,
            subscriptions: true,
            branches: true,
          },
        },
      },
    })
  }
}

// GET /api/admin/gyms/[id] — single gym detail for super_admin
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'غير مسجّل الدخول' }, { status: 401 })
    }
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'ممنوع' }, { status: 403 })
    }

    const { id } = await params
    const gym = await findGymByIdOrSlug(id)

    if (!gym) {
      return NextResponse.json({ error: 'الجيم غير موجود' }, { status: 404 })
    }

    return NextResponse.json({ gym })
  } catch (err) {
    console.error('Error fetching admin gym detail:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'حدث خطأ في السيرفر' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/gyms/[id] — super_admin edits a gym's details, plan, addons, status, billing, dates & notes
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
  const existingGym = await findGymByIdOrSlug(id)
  if (!existingGym) {
    return NextResponse.json({ error: 'الجيم غير موجود' }, { status: 404 })
  }

  const body = await request.json()
  const { 
    name, 
    ownerName, 
    ownerPhone, 
    ownerEmail, 
    phone, 
    city, 
    address, 
    basePlanPrice, 
    addons, 
    status, 
    billingCycle, 
    nextBillingDate,
    trialEndsAt,
    adminNotes,
    broadcastBanner
  } = body

  // Validate plan price if provided
  if (basePlanPrice !== undefined) {
    if (typeof basePlanPrice !== 'number' || !VALID_PLAN_PRICES.includes(basePlanPrice)) {
      return NextResponse.json(
        { error: `سعر الباقة غير صالح. الأسعار المتاحة: ${VALID_PLAN_PRICES.join('، ')} ج` },
        { status: 400 }
      )
    }
  }

  // If plan changes but addons not explicitly provided, auto-assign correct addons
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

  // If ownerEmail is changing, update associated User model email as well
  if (ownerEmail && existingGym.ownerEmail !== ownerEmail) {
    await prisma.user.updateMany({
      where: { email: existingGym.ownerEmail },
      data: { email: ownerEmail },
    })
  }

  const updateData: Record<string, unknown> = {
    ...(name !== undefined && { name }),
    ...(ownerName !== undefined && { ownerName }),
    ...(ownerPhone !== undefined && { ownerPhone }),
    ...(ownerEmail !== undefined && { ownerEmail }),
    ...(phone !== undefined && { phone }),
    ...(city !== undefined && { city }),
    ...(address !== undefined && { address }),
    ...(basePlanPrice !== undefined && { basePlanPrice }),
    ...(resolvedAddons !== undefined && { addons: resolvedAddons }),
    ...(status !== undefined && { status: status as GymStatus }),
    ...(billingCycle !== undefined && { billingCycle: billingCycle as BillingCycle }),
    ...(nextBillingDate !== undefined && {
      nextBillingDate: nextBillingDate ? new Date(nextBillingDate) : null,
    }),
    ...(trialEndsAt ? { trialEndsAt: new Date(trialEndsAt) } : {}),
    ...(adminNotes !== undefined && { adminNotes }),
  }

  if (broadcastBanner !== undefined) {
    try {
      updateData.broadcastBanner = broadcastBanner
    } catch {
      // Ignore if column doesn't exist yet
    }
  }

  try {
    const updated = await prisma.gym.update({
      where: { id: existingGym.id },
      data: updateData,
    })
    return NextResponse.json({ success: true, gym: updated })
  } catch (err) {
    // Retry without broadcastBanner if column not created
    delete updateData.broadcastBanner
    const updated = await prisma.gym.update({
      where: { id: existingGym.id },
      data: updateData,
    })
    return NextResponse.json({ success: true, gym: updated })
  }
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
  const existingGym = await findGymByIdOrSlug(id)
  if (!existingGym) {
    return NextResponse.json({ error: 'الجيم غير موجود' }, { status: 404 })
  }

  try {
    await prisma.gym.delete({
      where: { id: existingGym.id },
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
