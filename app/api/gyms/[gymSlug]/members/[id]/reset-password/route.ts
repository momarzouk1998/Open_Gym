import { NextResponse } from 'next/server'
import { getGymContextApi } from '@/lib/gym-context'
import { prisma } from '@/lib/prisma'
import { auditFromRequest } from '@/lib/audit'
import bcrypt from 'bcryptjs'

// POST /api/gyms/[gymSlug]/members/[id]/reset-password
export async function POST(
  request: Request,
  { params }: { params: Promise<{ gymSlug: string; id: string }> }
) {
  const { gymSlug, id } = await params
  const ctxResult = await getGymContextApi(gymSlug)
  if (!ctxResult.ok) {
    return NextResponse.json({ error: ctxResult.error }, { status: ctxResult.status })
  }
  const { gym, role, userId } = ctxResult.ctx

  // Only owner/manager can reset passwords
  if (role === 'cashier' || role === 'trainer') {
    return NextResponse.json({ error: 'لا تملك صلاحية إعادة تعيين كلمة المرور' }, { status: 403 })
  }

  try {
    // Verify member belongs to this gym
    const member = await prisma.member.findFirst({
      where: { id, gymId: gym.id },
    })

    if (!member) {
      return NextResponse.json({ error: 'العضو غير موجود' }, { status: 404 })
    }

    // Reset to default password
    const defaultPassword = '123456'
    const hashedPassword = await bcrypt.hash(defaultPassword, 12)

    await prisma.member.update({
      where: { id },
      data: { password: hashedPassword },
    })

    // Audit
    void auditFromRequest(request, gym.id, userId, 'member.password_reset', 'member', member.id, {
      memberName: member.fullName,
      memberPhone: member.phone,
    })

    return NextResponse.json({
      success: true,
      message: 'تم إعادة تعيين كلمة المرور إلى 123456',
    })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إعادة تعيين كلمة المرور' },
      { status: 500 }
    )
  }
}
