import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { slugify } from '@/lib/utils'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { generateGymBarcode } from '@/lib/barcode'
import type { AddonKey } from '@prisma/client'

// All addons unlocked during 14-day trial (no extra_branch — covered by branches)
const TRIAL_ADDONS: AddonKey[] = [
  'expenses',
  'staff',
  'trainers',
  'classes',
  'branches',
  'advanced_reports',
]

export async function POST(request: Request) {
  try {
    // Rate limit: max 5 registrations per IP per 10 minutes
    const ip = getClientIp(request)
    const rl = rateLimit(`register:${ip}`, { limit: 5, windowSecs: 600 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `محاولات كثيرة. حاول بعد ${rl.retryAfter} ثانية.` },
        {
          status: 429,
          headers: { 'Retry-After': String(rl.retryAfter) },
        }
      )
    }

    const body = await request.json()
    const {
      gymName,
      city,
      ownerName,
      ownerEmail,
      ownerPassword,
      ownerPhone,
    } = body

    // Validation — required fields
    if (!gymName || !ownerName || !ownerEmail || !ownerPassword || !ownerPhone) {
      return NextResponse.json(
        { error: 'بيانات ناقصة. املأ الحقول المطلوبة.' },
        { status: 400 }
      )
    }

    const phoneRegex = /^01[0-9]{9}$/
    if (!phoneRegex.test(ownerPhone.trim())) {
      return NextResponse.json(
        { error: 'رقم التليفون غير صحيح — مثال: 01012345678' },
        { status: 400 }
      )
    }

    if (ownerPassword.length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور لازم 6 حروف على الأقل' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: ownerEmail },
    })
    if (existingUser) {
      return NextResponse.json(
        { error: 'هذا البريد الإلكتروني مسجّل بالفعل' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(ownerPassword, 12)

    // Generate unique slug
    let slug = slugify(gymName)
    const existingGym = await prisma.gym.findUnique({ where: { slug } })
    if (existingGym) {
      slug = `${slug}-${Date.now().toString(36)}`
    }

    // Generate gym barcode
    const gymBarcode = generateGymBarcode(gymName)

    // Default: starter plan with all addons for trial
    const basePlanPrice = 299

    // Trial period: 7 days from now
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 7)

    // Create gym + user + profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create gym
      const gym = await tx.gym.create({
        data: {
          name: gymName,
          slug,
          city: city || null,
          ownerName,
          ownerPhone,
          ownerEmail,
          status: 'trial',
          trialEndsAt,
          basePlanPrice,
          addons: TRIAL_ADDONS,
          gymBarcode,
        },
      })

      // 2. Create main branch
      await tx.branch.create({
        data: {
          gymId: gym.id,
          name: 'الفرع الرئيسي',
          isMain: true,
        },
      })

      // 3. Create user
      const user = await tx.user.create({
        data: {
          name: ownerName,
          email: ownerEmail,
          password: hashedPassword,
        },
      })

      // 4. Create profile (gym_owner role)
      await tx.profile.create({
        data: {
          id: user.id,
          gymId: gym.id,
          role: 'gym_owner',
          fullName: ownerName,
          phone: ownerPhone,
          isActive: true,
        },
      })

      // 5. Create default subscription plans
      await tx.gymPlan.create({
        data: {
          gymId: gym.id,
          name: 'شهري',
          duration: 30,
          price: 300,
        },
      })

      await tx.gymPlan.create({
        data: {
          gymId: gym.id,
          name: 'ثلاثة أشهر',
          duration: 90,
          price: 800,
        },
      })

      return { gym, user }
    })

    return NextResponse.json({
      success: true,
      gymId: result.gym.id,
      userId: result.user.id,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التسجيل. حاول مرة أخرى.' },
      { status: 500 }
    )
  }
}
