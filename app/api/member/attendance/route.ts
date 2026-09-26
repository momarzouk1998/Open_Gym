import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getMemberSessionFromRequest } from '@/lib/member-auth'

// POST /api/member/attendance - self check-in
// The member identity comes from the signed session cookie, never from the request body,
// so a member can only ever check themselves in.
export async function POST(request: Request) {
  const session = await getMemberSessionFromRequest(request)
  if (!session) {
    return NextResponse.json({ error: 'غير مسجّل الدخول' }, { status: 401 })
  }

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    include: {
      subscriptions: {
        where: { status: 'active' },
        orderBy: { endDate: 'desc' },
        take: 1,
      },
    },
  })

  if (!member || member.gymId !== session.gymId) {
    return NextResponse.json({ error: 'العضو غير موجود' }, { status: 404 })
  }

  if (!member.isActive) {
    return NextResponse.json({ error: 'هذا العضو غير نشط' }, { status: 403 })
  }

  if (!member.barcode) {
    return NextResponse.json({ error: 'لا يوجد باركود لهذا العضو' }, { status: 400 })
  }

  const activeSubscription = member.subscriptions[0]
  if (!activeSubscription) {
    return NextResponse.json({ error: 'لا يوجد اشتراك نشط' }, { status: 403 })
  }
  if (new Date() > new Date(activeSubscription.endDate)) {
    return NextResponse.json({ error: 'الاشتراك منتهي' }, { status: 403 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const existingAttendance = await prisma.attendance.findFirst({
    where: {
      memberId: member.id,
      checkInTime: { gte: today },
      status: 'checked_in',
    },
  })

  if (existingAttendance) {
    return NextResponse.json(
      { error: 'تم تسجيل الحضور بالفعل اليوم', attendance: existingAttendance },
      { status: 400 }
    )
  }

  const attendance = await prisma.attendance.create({
    data: {
      gymId: member.gymId,
      memberId: member.id,
      branchId: member.branchId,
      barcode: member.barcode,
      status: 'checked_in',
    },
  })

  return NextResponse.json({ success: true, attendance })
}
