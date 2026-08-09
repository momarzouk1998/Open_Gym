import { NextResponse } from 'next/server'
import { getGymContextApi } from '@/lib/gym-context'
import { prisma } from '@/lib/prisma'
import { auditFromRequest } from '@/lib/audit'

// POST /api/gyms/[gymSlug]/attendance - Check in member by barcode
export async function POST(
  request: Request,
  { params }: { params: Promise<{ gymSlug: string }> }
) {
  const { gymSlug } = await params
  const ctxResult = await getGymContextApi(gymSlug)
  if (!ctxResult.ok) {
    return NextResponse.json({ error: ctxResult.error }, { status: ctxResult.status })
  }
  const { gym, userId } = ctxResult.ctx

  const body = await request.json()
  const { barcode, branchId } = body

  if (!barcode?.trim()) {
    return NextResponse.json({ error: 'الباركود مطلوب' }, { status: 400 })
  }

  // Find member by barcode
  const member = await prisma.member.findUnique({
    where: { barcode: barcode.trim() },
    include: {
      subscriptions: {
        where: { status: 'active' },
        orderBy: { endDate: 'desc' },
        take: 1,
      },
    },
  })

  if (!member) {
    return NextResponse.json({ error: 'الباركود غير صحيح' }, { status: 404 })
  }

  if (member.gymId !== gym.id) {
    return NextResponse.json({ error: 'هذا العضو لا ينتمي لهذا الجيم' }, { status: 403 })
  }

  if (!member.isActive) {
    return NextResponse.json({ error: 'هذا العضو غير نشط' }, { status: 403 })
  }

  // Check if member has active subscription
  const activeSubscription = member.subscriptions[0]
  if (!activeSubscription) {
    return NextResponse.json({ error: 'لا يوجد اشتراك نشط' }, { status: 403 })
  }

  // Check if subscription is expired
  if (new Date() > new Date(activeSubscription.endDate)) {
    return NextResponse.json({ error: 'الاشتراك منتهي' }, { status: 403 })
  }

  // Check if already checked in today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const existingAttendance = await prisma.attendance.findFirst({
    where: {
      memberId: member.id,
      checkInTime: { gte: today },
      status: 'checked_in',
    },
  })

  if (existingAttendance) {
    return NextResponse.json({ 
      error: 'تم تسجيل الحضور بالفعل اليوم',
      attendance: existingAttendance 
    }, { status: 400 })
  }

  // Create attendance record
  const attendance = await prisma.attendance.create({
    data: {
      gymId: gym.id,
      memberId: member.id,
      branchId: branchId || null,
      barcode: barcode.trim(),
      status: 'checked_in',
    },
  })

  // Audit
  await auditFromRequest(request, gym.id, userId, 'attendance.check_in', 'attendance', attendance.id, {
    memberName: member.fullName,
    memberNumber: member.memberNumber,
    barcode: barcode,
  })

  return NextResponse.json({ 
    success: true, 
    attendance,
    member: {
      id: member.id,
      fullName: member.fullName,
      memberNumber: member.memberNumber,
      phone: member.phone,
    },
    subscription: {
      endDate: activeSubscription.endDate,
    }
  })
}

// GET /api/gyms/[gymSlug]/attendance - Get attendance records
export async function GET(
  request: Request,
  { params }: { params: Promise<{ gymSlug: string }> }
) {
  const { gymSlug } = await params
  const ctxResult = await getGymContextApi(gymSlug)
  if (!ctxResult.ok) {
    return NextResponse.json({ error: ctxResult.error }, { status: ctxResult.status })
  }
  const { gym } = ctxResult.ctx

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const startDate = new Date(date)
  startDate.setHours(0, 0, 0, 0)
  const endDate = new Date(date)
  endDate.setHours(23, 59, 59, 999)

  const [attendance, total] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        gymId: gym.id,
        checkInTime: { gte: startDate, lte: endDate },
      },
      include: {
        member: {
          select: {
            id: true,
            fullName: true,
            memberNumber: true,
            phone: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { checkInTime: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.attendance.count({
      where: {
        gymId: gym.id,
        checkInTime: { gte: startDate, lte: endDate },
      },
    }),
  ])

  return NextResponse.json({
    attendance,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}