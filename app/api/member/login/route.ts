import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, password } = body

    if (!phone?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: 'رقم التليفون وكلمة المرور مطلوبان' },
        { status: 400 }
      )
    }

    // Validate phone format
    const phoneRegex = /^01[0-9]{9}$/
    if (!phoneRegex.test(phone.trim())) {
      return NextResponse.json(
        { error: 'رقم التليفون غير صحيح — مثال: 01012345678' },
        { status: 400 }
      )
    }

    // Find member by phone (across all gyms)
    const member = await prisma.member.findFirst({
      where: { 
        phone: phone.trim(),
        isActive: true 
      },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
            slug: true,
            gymBarcode: true,
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
      return NextResponse.json(
        { error: 'رقم التليفون أو كلمة المرور غير صحيحة' },
        { status: 401 }
      )
    }

    // Check if member has password
    if (!member.password) {
      return NextResponse.json(
        { error: 'لم يتم تعيين كلمة مرور لهذا الحساب. تواصل مع صاحب الجيم' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, member.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'رقم التليفون أو كلمة المرور غير صحيحة' },
        { status: 401 }
      )
    }

    // Return member data (without password)
    const { password: _, ...memberData } = member

    return NextResponse.json({
      success: true,
      member: memberData,
    })
  } catch (error) {
    console.error('Member login error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الدخول' },
      { status: 500 }
    )
  }
}