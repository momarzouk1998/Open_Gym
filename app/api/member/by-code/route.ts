import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/member/by-code?code=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code?.trim()) {
    return NextResponse.json({ error: 'الكود مطلوب' }, { status: 400 })
  }

  // Try to find member by barcode or member number
  const member = await prisma.member.findFirst({
    where: {
      OR: [
        { barcode: code.trim() },
        { memberNumber: code.trim() },
      ],
    },
    include: {
      gym: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      subscriptions: {
        where: { status: 'active' },
        orderBy: { endDate: 'desc' },
        take: 1,
      },
    },
  })

  if (!member) {
    return NextResponse.json({ error: 'لم يتم العثور على العضو' }, { status: 404 })
  }

  if (!member.isActive) {
    return NextResponse.json({ error: 'هذا العضو غير نشط' }, { status: 403 })
  }

  return NextResponse.json({
    id: member.id,
    fullName: member.fullName,
    memberNumber: member.memberNumber,
    barcode: member.barcode,
    phone: member.phone,
    gymName: member.gym.name,
    gymSlug: member.gym.slug,
    activeSubscription: member.subscriptions[0] || null,
  })
}