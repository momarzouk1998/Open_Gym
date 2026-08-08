import { NextResponse } from 'next/server'
import { getGymContextApi } from '@/lib/gym-context'
import { prisma } from '@/lib/prisma'

// GET /api/gyms/[gymSlug]/audit-logs?page=1&action=
export async function GET(
  request: Request,
  { params }: { params: Promise<{ gymSlug: string }> }
) {
  const { gymSlug } = await params
  const ctxResult = await getGymContextApi(gymSlug)
  if (!ctxResult.ok) {
    return NextResponse.json({ error: ctxResult.error }, { status: ctxResult.status })
  }
  const { gym, role } = ctxResult.ctx

  // Only owner or manager can view audit logs
  if (role === 'cashier' || role === 'trainer') {
    return NextResponse.json({ error: 'غير مصرح لك باستعراض سجل العمليات' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = 20
  const action = searchParams.get('action') || undefined

  const where = {
    gymId: gym.id,
    ...(action ? { action } : {}),
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ])

  // Enhance logs with user profiles/names if available
  const userIds = Array.from(new Set(logs.map((l) => l.userId)))
  const profiles = await prisma.profile.findMany({
    where: { id: { in: userIds } },
    select: { id: true, fullName: true, role: true },
  })
  const userMap = new Map(profiles.map((p) => [p.id, p]))

  const formattedLogs = logs.map((l) => ({
    ...l,
    user: userMap.get(l.userId) || { fullName: 'المسؤول', role: 'owner' },
  }))

  return NextResponse.json({
    logs: formattedLogs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}
