import { NextResponse } from 'next/server'
import { getGymContextApi } from '@/lib/gym-context'
import { prisma } from '@/lib/prisma'
import { auditFromRequest } from '@/lib/audit'

// DELETE /api/gyms/[gymSlug]/classes/[id]/bookings/[bookingId] — cancel a booking
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ gymSlug: string; id: string; bookingId: string }> }
) {
  const { gymSlug, id, bookingId } = await params
  const ctxResult = await getGymContextApi(gymSlug)
  if (!ctxResult.ok) {
    return NextResponse.json({ error: ctxResult.error }, { status: ctxResult.status })
  }
  const { gym, userId } = ctxResult.ctx

  const booking = await prisma.classBooking.findFirst({
    where: { id: bookingId, classId: id, gymId: gym.id },
    include: { member: { select: { fullName: true } }, class_: { select: { name: true } } },
  })
  if (!booking) {
    return NextResponse.json({ error: 'الحجز غير موجود' }, { status: 404 })
  }

  await prisma.classBooking.delete({ where: { id: bookingId } })

  void auditFromRequest(request, gym.id, userId, 'class.cancel_booking', 'class_booking', bookingId, {
    className: booking.class_.name,
    memberName: booking.member.fullName,
  })

  return NextResponse.json({ success: true })
}
