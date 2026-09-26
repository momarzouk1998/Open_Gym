import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getMemberSessionFromRequest } from '@/lib/member-auth'

export async function POST(request: Request) {
  try {
    const session = await getMemberSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'غير مسجّل الدخول' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور لازم 6 حروف على الأقل' },
        { status: 400 }
      )
    }

    // Find member — identity comes from the verified session, never from the request body.
    const member = await prisma.member.findUnique({
      where: { id: session.memberId },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'العضو غير موجود' },
        { status: 404 }
      )
    }

    // Check if member has password
    if (!member.password) {
      return NextResponse.json(
        { error: 'لم يتم تعيين كلمة مرور لهذا الحساب' },
        { status: 400 }
      )
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, member.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'كلمة المرور الحالية غير صحيحة' },
        { status: 401 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password
    await prisma.member.update({
      where: { id: member.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح',
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تغيير كلمة المرور' },
      { status: 500 }
    )
  }
}
