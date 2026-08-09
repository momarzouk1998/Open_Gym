import { NextResponse } from 'next/server'
import { getGymContextApi } from '@/lib/gym-context'
import { getMembers, generateMemberNumber } from '@/lib/queries'
import { prisma } from '@/lib/prisma'
import { auditFromRequest } from '@/lib/audit'
import { generateBarcode } from '@/lib/barcode'
import bcrypt from 'bcryptjs'
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
  const { fullName, phone, password, gender, notes } = body

  if (!fullName?.trim()) {
    return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 })
  }

  if (!phone?.trim()) {
    return NextResponse.json({ error: 'رقم التليفون مطلوب' }, { status: 400 })
  }

  // Validate phone format
  const phoneRegex = /^01[0-9]{9}$/
  if (!phoneRegex.test(phone.trim())) {
    return NextResponse.json(
      { error: 'رقم التليفون غير صحيح — مثال: 01012345678' },
      { status: 400 }
    )
  }

  // Hash password if provided, otherwise use default password
  let hashedPassword = null
  const passwordToUse = (password && password.trim()) ? password.trim() : '123456'
  
  if (passwordToUse.length < 6) {
    return NextResponse.json({ error: 'كلمة المرور لازم 6 حروف على الأقل' }, { status: 400 })
  }
  hashedPassword = await bcrypt.hash(passwordToUse, 12)

  const memberNumber = await generateMemberNumber(gym.id)
  const barcode = generateBarcode()

  const member = await prisma.member.create({
    data: {
      gymId: gym.id,
      memberNumber,
      barcode,
      fullName: fullName.trim(),
      phone: phone.trim(),
      password: hashedPassword,
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
