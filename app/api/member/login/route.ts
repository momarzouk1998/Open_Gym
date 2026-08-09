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

    // Find all active members by phone (across all gyms)
    const members = await prisma.member.findMany({
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
          include: {
            plan: {
              select: { name: true }
            }
          }
        },
      },
    })

    if (!members || members.length === 0) {
      return NextResponse.json(
        { error: 'رقم التليفون أو كلمة المرور غير صحيحة' },
        { status: 401 }
      )
    }

    // Match member with valid password
    let matchedMember = null
    for (const m of members) {
      let isValid = false
      if (!m.password) {
        if (password.trim() === '123456') {
          isValid = true
          // Auto-hash default password for older member
          const hash = await bcrypt.hash('123456', 12)
          await prisma.member.update({
            where: { id: m.id },
            data: { password: hash },
          })
        }
      } else {
        isValid = await bcrypt.compare(password.trim(), m.password)
      }

      if (isValid) {
        matchedMember = m
        break
      }
    }

    if (!matchedMember) {
      return NextResponse.json(
        { error: 'رقم التليفون أو كلمة المرور غير صحيحة' },
        { status: 401 }
      )
    }

    // Return member data (without password)
    const { password: _, ...memberData } = matchedMember

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