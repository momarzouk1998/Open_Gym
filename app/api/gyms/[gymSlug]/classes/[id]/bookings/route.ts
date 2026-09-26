import { NextResponse } from 'next/server'
import { getGymContextApi } from '@/lib/gym-context'
import { prisma } from '@/lib/prisma'
import { auditFromRequest } from '@/lib/audit'

// GET /api/gyms/[gymSlug]/classes/[id]/bookings — list attendees for this class
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

  const classRoom = await prisma.classRoom.findFirst({ where: { id, gymId: gym.id } })
  if (!classRoom) {
    return NextResponse.json({ error: 'الكلاس غير موجود' }, { status: 404 })
  }

  const bookings = await prisma.classBooking.findMany({
    where: { classId: id, gymId: gym.id },
    include: {
      member: { select: { id: true, fullName: true, phone: true, memberNumber: true } },
    },
    orderBy: { bookedAt: 'desc' },
  })

  return NextResponse.json({ bookings, capacity: classRoom.capacity })
}

// POST /api/gyms/[gymSlug]/classes/[id]/bookings — book a member into this class
export async function POST(
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
  const { memberId } = body

  if (!memberId) {
    return NextResponse.json({ error: 'العضو مطلوب' }, { status: 400 })
  }

  const classRoom = await prisma.classRoom.findFirst({ where: { id, gymId: gym.id } })
  if (!classRoom) {
    return NextResponse.json({ error: 'الكلاس غير موجود' }, { status: 404 })
  }
  if (!classRoom.isActive) {
    return NextResponse.json({ error: 'هذا الكلاس غير نشط' }, { status: 400 })
  }

  const member = await prisma.member.findFirst({ where: { id: memberId, gymId: gym.id } })
  if (!member) {
    return NextResponse.json({ error: 'العضو غير موجود' }, { status: 404 })
  }
  if (!member.isActive) {
    return NextResponse.json({ error: 'هذا العضو غير نشط' }, { status: 400 })
  }

  const existingBooking = await prisma.classBooking.findFirst({
    where: { classId: id, memberId },
  })
  if (existingBooking) {
    return NextResponse.json({ error: 'العضو محجوز في هذا الكلاس بالفعل' }, { status: 400 })
  }

  const currentCount = await prisma.classBooking.count({ where: { classId: id } })
  if (currentCount >= classRoom.capacity) {
    return NextResponse.json({ error: 'الكلاس مكتمل العدد' }, { status: 400 })
  }

  const booking = await prisma.classBooking.create({
    data: { classId: id, memberId, gymId: gym.id },
    include: { member: { select: { id: true, fullName: true, phone: true, memberNumber: true } } },
  })

  void auditFromRequest(request, gym.id, userId, 'class.book', 'class_booking', booking.id, {
    className: classRoom.name,
    memberName: member.fullName,
  })

  return NextResponse.json({ success: true, booking }, { status: 201 })
}
