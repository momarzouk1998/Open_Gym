import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getMemberSessionFromRequest } from '@/lib/member-auth'

// GET /api/member/attendance - is the current member currently checked in?
export async function GET(request: Request) {
  const session = await getMemberSessionFromRequest(request)
  if (!session) {
    return NextResponse.json({ error: 'غير مسجّل الدخول' }, { status: 401 })
  }

  const openAttendance = await prisma.attendance.findFirst({
    where: { memberId: session.memberId, status: 'checked_in' },
    orderBy: { checkInTime: 'desc' },
  })

  return NextResponse.json({ checkedIn: !!openAttendance, attendance: openAttendance })
}

// POST /api/member/attendance - self check-in / check-out (toggles based on current state)
// The member identity comes from the signed session cookie, never from the request body,
// so a member can only ever check themselves in or out.
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

  // If there's an open check-in, this action checks the member out.
  const openAttendance = await prisma.attendance.findFirst({
    where: { memberId: member.id, status: 'checked_in' },
    orderBy: { checkInTime: 'desc' },
  })

  if (openAttendance) {
    const attendance = await prisma.attendance.update({
      where: { id: openAttendance.id },
      data: { checkOutTime: new Date(), status: 'checked_out' },
    })
    return NextResponse.json({ success: true, action: 'check_out', attendance })
  }

  // Otherwise, this action checks the member in — requires an active subscription.
  const activeSubscription = member.subscriptions[0]
  if (!activeSubscription) {
    return NextResponse.json({ error: 'لا يوجد اشتراك نشط' }, { status: 403 })
  }
  if (new Date() > new Date(activeSubscription.endDate)) {
    return NextResponse.json({ error: 'الاشتراك منتهي' }, { status: 403 })
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

  return NextResponse.json({ success: true, action: 'check_in', attendance })
}
