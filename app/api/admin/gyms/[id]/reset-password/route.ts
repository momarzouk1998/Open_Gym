import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST /api/admin/gyms/[id]/reset-password — super_admin resets owner password to 123456
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

  // Find the owner user account by ownerEmail
  const ownerUser = await prisma.user.findUnique({
    where: { email: gym.ownerEmail },
  })

  if (!ownerUser) {
    return NextResponse.json({ error: 'حساب مالك الجيم غير موجود' }, { status: 404 })
  }

  // Hash new default password '123456'
  const hashedPassword = await bcrypt.hash('123456', 12)

  await prisma.user.update({
    where: { id: ownerUser.id },
    data: { password: hashedPassword },
  })

  return NextResponse.json({
    success: true,
    message: 'تم إعادة تعيين كلمة مرور مالك الجيم إلى 123456 بنجاح',
  })
}
