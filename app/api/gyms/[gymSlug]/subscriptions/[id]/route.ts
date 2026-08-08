import { NextResponse } from 'next/server'
import { getGymContextApi } from '@/lib/gym-context'
import { prisma } from '@/lib/prisma'
import { auditFromRequest } from '@/lib/audit'

// PATCH /api/gyms/[gymSlug]/subscriptions/[id] — freeze/unfreeze/cancel
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ gymSlug: string; id: string }> }
) {
  const { gymSlug, id } = await params
  const ctxResult = await getGymContextApi(gymSlug)
  if (!ctxResult.ok) {
    return NextResponse.json({ error: ctxResult.error }, { status: ctxResult.status })
  }
  const { gym, userId } = ctxResult.ctx

  const body = await request.json()
  const { action } = body // 'freeze' | 'unfreeze' | 'cancel'

  const sub = await prisma.subscription.findFirst({ where: { id, gymId: gym.id } })
  if (!sub) {
    return NextResponse.json({ error: 'الاشتراك غير موجود' }, { status: 404 })
  }

  let updateData: any = {}

  if (action === 'freeze') {
    if (sub.status === 'frozen') {
      return NextResponse.json({ error: 'الاشتراك مجمد بالفعل' }, { status: 400 })
    }
    updateData = {
      status: 'frozen',
      frozenAt: new Date(),
    }
  } else if (action === 'unfreeze') {
    if (sub.status !== 'frozen') {
      return NextResponse.json({ error: 'الاشتراك غير مجمد' }, { status: 400 })
    }
    // Extend end date by the frozen period
    const frozenDays = sub.frozenAt
      ? Math.ceil((Date.now() - sub.frozenAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0
    const newEnd = new Date(sub.endDate)
    newEnd.setDate(newEnd.getDate() + frozenDays)
    updateData = {
      status: 'active',
      unfrozenAt: new Date(),
      frozenDays: sub.frozenDays + frozenDays,
      endDate: newEnd,
    }
  } else if (action === 'cancel') {
    updateData = { status: 'cancelled' }
  } else {
    return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 })
  }

  const updated = await prisma.subscription.update({
    where: { id },
    data: updateData,
  })

  const auditActionMap: Record<string, any> = {
    freeze: 'subscription.freeze',
    unfreeze: 'subscription.unfreeze',
    cancel: 'subscription.cancel',
  }

  if (auditActionMap[action]) {
    void auditFromRequest(request, gym.id, userId, auditActionMap[action], 'subscription', updated.id, {
      memberId: updated.memberId,
      status: updated.status,
    })
  }

  return NextResponse.json({ success: true, subscription: updated })
}
