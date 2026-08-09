import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createImpersonationToken } from '@/lib/impersonation'

// POST /api/admin/gyms/[id]/impersonate — Super Admin generates short-lived login token for gym owner
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'غير مسجّل الدخول' }, { status: 401 })
  }
  if (session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'ممنوع' }, { status: 403 })
  }

  const { id } = await params
  const gym = await prisma.gym.findUnique({
    where: { id },
    select: { id: true, ownerEmail: true, name: true },
  })

  if (!gym) {
    return NextResponse.json({ error: 'الجيم غير موجود' }, { status: 404 })
  }

  const ownerUser = await prisma.user.findUnique({
    where: { email: gym.ownerEmail },
  })

  if (!ownerUser) {
    return NextResponse.json({ error: 'حساب مالك الجيم غير موجود' }, { status: 404 })
  }

  const token = createImpersonationToken(ownerUser.id)

  return NextResponse.json({
    success: true,
    impersonationToken: token,
    gymName: gym.name,
    ownerEmail: gym.ownerEmail,
  })
}
