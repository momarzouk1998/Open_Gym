import { NextResponse } from 'next/server'
import { getGymContextApi } from '@/lib/gym-context'
import { prisma } from '@/lib/prisma'
import { auditFromRequest } from '@/lib/audit'

// GET /api/gyms/[gymSlug]/expenses/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ gymSlug: string; id: string }> }
) {
  const { gymSlug, id } = await params
  const ctxResult = await getGymContextApi(gymSlug)
  if (!ctxResult.ok) {
    return NextResponse.json({ error: ctxResult.error }, { status: ctxResult.status })
  }
  const { gym } = ctxResult.ctx

  const expense = await prisma.expense.findFirst({ where: { id, gymId: gym.id } })
  if (!expense) {
    return NextResponse.json({ error: 'المصروف غير موجود' }, { status: 404 })
  }

  return NextResponse.json({ expense })
}

// PATCH /api/gyms/[gymSlug]/expenses/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ gymSlug: string; id: string }> }
) {
  const { gymSlug, id } = await params
  const ctxResult = await getGymContextApi(gymSlug)
  if (!ctxResult.ok) {
    return NextResponse.json({ error: ctxResult.error }, { status: ctxResult.status })
  }
  const { gym } = ctxResult.ctx

  const body = await request.json()

  const existing = await prisma.expense.findFirst({ where: { id, gymId: gym.id } })
  if (!existing) {
    return NextResponse.json({ error: 'المصروف غير موجود' }, { status: 404 })
  }

  const { category, amount, description, date, branchId } = body

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      ...(category !== undefined && { category }),
      ...(amount !== undefined && { amount: parseFloat(amount) }),
      ...(description !== undefined && { description }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(branchId !== undefined && { branchId }),
    },
  })

  return NextResponse.json({ success: true, expense })
}

// DELETE /api/gyms/[gymSlug]/expenses/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ gymSlug: string; id: string }> }
) {
  const { gymSlug, id } = await params
  const ctxResult = await getGymContextApi(gymSlug)
  if (!ctxResult.ok) {
    return NextResponse.json({ error: ctxResult.error }, { status: ctxResult.status })
  }
  const { gym, userId } = ctxResult.ctx

  const existing = await prisma.expense.findFirst({ where: { id, gymId: gym.id } })
  if (!existing) {
    return NextResponse.json({ error: 'المصروف غير موجود' }, { status: 404 })
  }

  await prisma.expense.delete({ where: { id } })

  void auditFromRequest(request, gym.id, userId, 'expense.delete', 'expense', existing.id, {
    category: existing.category,
    amount: existing.amount,
  })

  return NextResponse.json({ success: true })
}
