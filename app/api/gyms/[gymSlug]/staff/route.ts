import { NextResponse } from 'next/server'
import { getGymContextApi } from '@/lib/gym-context'
import { getStaff } from '@/lib/queries'
import { prisma } from '@/lib/prisma'
import { auditFromRequest } from '@/lib/audit'
import type { UserRole } from '@prisma/client'

// GET /api/gyms/[gymSlug]/staff?search=&page=
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
  const search = searchParams.get('search') || undefined
  const page = parseInt(searchParams.get('page') || '1')

  const result = await getStaff(gym.id, { search, page })
  return NextResponse.json(result)
}

// POST /api/gyms/[gymSlug]/staff
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
  const { fullName, phone, branchId } = body

  if (!fullName?.trim()) {
    return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 })
  }

  const profile = await prisma.profile.create({
    data: {
      gymId: gym.id,
      fullName: fullName.trim(),
      phone: phone || null,
      branchId: branchId || null,
      role: 'gym_manager' as UserRole,
    },
  })

  void auditFromRequest(request, gym.id, userId, 'staff.create', 'profile', profile.id, {
    name: profile.fullName,
    role: profile.role,
  })

  return NextResponse.json({ success: true, staff: profile }, { status: 201 })
}
