import { NextResponse } from 'next/server'
import { getGymContextApi } from '@/lib/gym-context'
import { getMembers, generateMemberNumber } from '@/lib/queries'
import { prisma } from '@/lib/prisma'
import { auditFromRequest } from '@/lib/audit'
import type { GenderType } from '@prisma/client'

// GET /api/gyms/[gymSlug]/members?search=&status=&page=
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
  const status = (searchParams.get('status') as 'active' | 'inactive') || undefined
  const page = parseInt(searchParams.get('page') || '1')

  const result = await getMembers(gym.id, { search, status, page })
  return NextResponse.json(result)
}

// POST /api/gyms/[gymSlug]/members
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
  const { fullName, phone, gender, notes } = body

  if (!fullName?.trim()) {
    return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 })
  }

  const memberNumber = await generateMemberNumber(gym.id)

  const member = await prisma.member.create({
    data: {
      gymId: gym.id,
      memberNumber,
      fullName: fullName.trim(),
      phone: phone || null,
      gender: (gender as GenderType) || null,
      notes: notes || null,
    },
  })

  // Audit
  await auditFromRequest(request, gym.id, userId, 'member.create', 'member', member.id, {
    name: member.fullName,
    memberNumber: member.memberNumber,
  })

  return NextResponse.json({ success: true, member }, { status: 201 })
}
