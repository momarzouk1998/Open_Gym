import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getMemberSessionFromRequest } from '@/lib/member-auth'

// GET /api/member/me - Return the currently logged-in member's fresh data
export async function GET(request: Request) {
  const session = await getMemberSessionFromRequest(request)
  if (!session) {
    return NextResponse.json({ error: 'غير مسجّل الدخول' }, { status: 401 })
  }

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    include: {
      gym: {
        select: { id: true, name: true, slug: true, gymBarcode: true },
      },
      subscriptions: {
        where: { status: 'active' },
        orderBy: { endDate: 'desc' },
        take: 1,
        include: { plan: { select: { name: true } } },
      },
    },
  })

  if (!member || !member.isActive) {
    return NextResponse.json({ error: 'العضو غير موجود' }, { status: 404 })
  }

  const { password: _password, ...memberData } = member
  return NextResponse.json({ member: memberData })
}
