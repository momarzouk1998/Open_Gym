import { NextResponse } from 'next/server'
import { getGymContextApi } from '@/lib/gym-context'
import { prisma } from '@/lib/prisma'

// GET /api/gyms/[gymSlug]/staff/[id]
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

  const profile = await prisma.profile.findFirst({
    where: { id, gymId: gym.id, role: 'gym_manager' },
  })
  if (!profile) {
    return NextResponse.json({ error: 'الموظف غير موجود' }, { status: 404 })
  }

  return NextResponse.json({ staff: profile })
}

// PATCH /api/gyms/[gymSlug]/staff/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ gymSlug: string; id: string }> }
) {
  const { gymSlug, id } = await params
  const ctxResult = await getGymContextApi(gymSlug)
  if (!ctxResult.ok) {
    return NextResponse.json({ error: ctxResult.error }, { status: ctxResult.status })
  }
  const { gym, role } = ctxResult.ctx

  if (role === 'cashier' || role === 'trainer') {
    return NextResponse.json({ error: 'لا تملك صلاحية تعديل الموظفين' }, { status: 403 })
  }

  const body = await request.json()

  const existing = await prisma.profile.findFirst({
    where: { id, gymId: gym.id, role: 'gym_manager' },
  })
  if (!existing) {
    return NextResponse.json({ error: 'الموظف غير موجود' }, { status: 404 })
  }

  const { fullName, phone, branchId, isActive } = body

  const profile = await prisma.profile.update({
    where: { id },
    data: {
      ...(fullName !== undefined && { fullName }),
      ...(phone !== undefined && { phone }),
      ...(branchId !== undefined && { branchId }),
      ...(isActive !== undefined && { isActive }),
    },
  })

  return NextResponse.json({ success: true, staff: profile })
}

// DELETE /api/gyms/[gymSlug]/staff/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ gymSlug: string; id: string }> }
) {
  const { gymSlug, id } = await params
  const ctxResult = await getGymContextApi(gymSlug)
  if (!ctxResult.ok) {
    return NextResponse.json({ error: ctxResult.error }, { status: ctxResult.status })
  }
  const { gym, role } = ctxResult.ctx

  if (role === 'cashier' || role === 'trainer') {
    return NextResponse.json({ error: 'لا تملك صلاحية حذف الموظفين' }, { status: 403 })
  }

  const existing = await prisma.profile.findFirst({
    where: { id, gymId: gym.id, role: 'gym_manager' },
  })
  if (!existing) {
    return NextResponse.json({ error: 'الموظف غير موجود' }, { status: 404 })
  }

  await prisma.profile.update({ where: { id }, data: { isActive: false } })

  return NextResponse.json({ success: true })
}
