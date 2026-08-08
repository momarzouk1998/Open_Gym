import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

// ========================================
// DASHBOARD STATS
// ========================================

export async function getDashboardStats(gymId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [totalMembers, activeSubs, expiringSoon, monthlyRevenueAgg] =
    await Promise.all([
      prisma.member.count({
        where: { gymId, isActive: true },
      }),
      prisma.subscription.count({
        where: {
          gymId,
          status: 'active',
          endDate: { gte: now },
        },
      }),
      prisma.subscription.count({
        where: {
          gymId,
          status: 'active',
          endDate: { gte: now, lte: inSevenDays },
        },
      }),
      prisma.payment.aggregate({
        where: {
          gymId,
          status: 'paid',
          paidAt: { gte: startOfMonth },
        },
        _sum: { finalAmount: true },
      }),
    ])

  return {
    totalMembers,
    activeSubs,
    expiringSoon,
    monthlyRevenue: monthlyRevenueAgg._sum.finalAmount || 0,
  }
}

export async function getRevenueChart(gymId: string, months = 6) {
  const now = new Date()
  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ]

  // Build month windows upfront, then fire all aggregates in parallel (single round-trip batch)
  const windows = Array.from({ length: months }, (_, idx) => {
    const i = months - 1 - idx
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    return { start, end }
  })

  const aggs = await Promise.all(
    windows.map(({ start, end }) =>
      prisma.payment.aggregate({
        where: { gymId, status: 'paid', paidAt: { gte: start, lt: end } },
        _sum: { finalAmount: true },
      })
    )
  )

  return windows.map(({ start }, idx) => ({
    month: `${start.getFullYear()}-${start.getMonth() + 1}`,
    revenue: aggs[idx]._sum.finalAmount || 0,
    label: monthNames[start.getMonth()],
  }))
}

// ========================================
// MEMBERS
// ========================================

export interface MemberFilters {
  search?: string
  status?: 'active' | 'inactive'
  page?: number
  pageSize?: number
}

export async function getMembers(gymId: string, filters: MemberFilters = {}) {
  const { search, status, page = 1, pageSize = 20 } = filters

  const where: Prisma.MemberWhereInput = {
    gymId,
    ...(status && { isActive: status === 'active' }),
    ...(search && {
      OR: [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { memberNumber: { contains: search } },
      ],
    }),
  }

  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        subscriptions: {
          orderBy: { endDate: 'desc' },
          take: 1,
          select: { id: true, endDate: true, status: true },
        },
      },
    }),
    prisma.member.count({ where }),
  ])

  return { members, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function getMember(id: string, gymId: string) {
  return prisma.member.findFirst({
    where: { id, gymId },
    include: {
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        include: { plan: true },
      },
      payments: {
        orderBy: { paidAt: 'desc' },
        take: 20,
      },
      trainer: { select: { id: true, fullName: true } },
    },
  })
}

export async function generateMemberNumber(gymId: string): Promise<string> {
  // Use a random suffix instead of count-based sequential numbering to avoid
  // race conditions when two members are created simultaneously.
  // Format: PREFIX-YYMM-XXXXX (prefix from gym slug + year-month + 5 random hex chars)
  const gym = await prisma.gym.findUnique({
    where: { id: gymId },
    select: { slug: true },
  })
  const prefix = gym?.slug?.slice(0, 3).toUpperCase() || 'GYM'
  const now = new Date()
  const yymm = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`
  const rand = Math.floor(Math.random() * 0xfffff).toString(16).toUpperCase().padStart(5, '0')
  return `${prefix}-${yymm}-${rand}`
}

// ========================================
// SUBSCRIPTIONS
// ========================================

export interface SubscriptionFilters {
  search?: string
  status?: 'active' | 'expired' | 'frozen' | 'all'
  page?: number
  pageSize?: number
}

export async function getSubscriptions(gymId: string, filters: SubscriptionFilters = {}) {
  const { search, status, page = 1, pageSize = 20 } = filters
  const now = new Date()

  const where: Prisma.SubscriptionWhereInput = {
    gymId,
    ...(status && status !== 'all' && { status }),
    ...(search && {
      member: {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      },
    }),
  }

  const [subscriptions, total, active, expired, frozen] = await Promise.all([
    prisma.subscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        member: { select: { id: true, fullName: true, phone: true, memberNumber: true } },
        plan: { select: { id: true, name: true, duration: true } },
      },
    }),
    prisma.subscription.count({ where }),
    prisma.subscription.count({
      where: { gymId, status: 'active', endDate: { gte: now } },
    }),
    prisma.subscription.count({
      where: { gymId, endDate: { lt: now } },
    }),
    prisma.subscription.count({
      where: { gymId, status: 'frozen' },
    }),
  ])

  return {
    subscriptions,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    stats: { active, expired, frozen },
  }
}

export async function getExpiringSubscriptions(gymId: string, days = 7) {
  const now = new Date()
  const limit = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

  return prisma.subscription.findMany({
    where: {
      gymId,
      status: 'active',
      endDate: { gte: now, lte: limit },
    },
    include: {
      member: {
        select: { id: true, fullName: true, phone: true },
      },
      plan: { select: { name: true } },
    },
    orderBy: { endDate: 'asc' },
    take: 50,
  })
}

// Subscriptions whose endDate has already passed (regardless of status field).
// Returns member phone so the gym owner can WhatsApp them to renew.
export async function getExpiredSubscriptions(gymId: string) {
  const now = new Date()
  return prisma.subscription.findMany({
    where: {
      gymId,
      endDate: { lt: now },
    },
    include: {
      member: {
        select: { id: true, fullName: true, phone: true },
      },
      plan: { select: { name: true } },
    },
    orderBy: { endDate: 'desc' },
    take: 200,
  })
}

// Admin (super_admin) variants — cross-gym, includes gym name.
export async function getExpiringSubscriptionsAdmin(days = 7) {
  const now = new Date()
  const limit = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  return prisma.subscription.findMany({
    where: {
      status: 'active',
      endDate: { gte: now, lte: limit },
    },
    include: {
      member: { select: { id: true, fullName: true, phone: true } },
      plan: { select: { name: true } },
      gym: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { endDate: 'asc' },
    take: 100,
  })
}

export async function getExpiredSubscriptionsAdmin() {
  const now = new Date()
  return prisma.subscription.findMany({
    where: {
      endDate: { lt: now },
    },
    include: {
      member: { select: { id: true, fullName: true, phone: true } },
      plan: { select: { name: true } },
      gym: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { endDate: 'desc' },
    take: 100,
  })
}

// ========================================
// PAYMENTS
// ========================================

export interface PaymentFilters {
  search?: string
  method?: string
  status?: 'paid' | 'pending' | 'all'
  page?: number
  pageSize?: number
}

export async function getPayments(gymId: string, filters: PaymentFilters = {}) {
  const { search, method, status, page = 1, pageSize = 20 } = filters

  const where: Prisma.PaymentWhereInput = {
    gymId,
    ...(method && { method: method as any }),
    ...(status && status !== 'all' && { status }),
    ...(search && {
      member: {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      },
    }),
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [payments, total, todayAgg, monthAgg, pendingAgg] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { paidAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        member: { select: { id: true, fullName: true, phone: true } },
        subscription: { select: { id: true, plan: { select: { name: true } } } },
      },
    }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({
      where: { gymId, status: 'paid', paidAt: { gte: startOfDay } },
      _sum: { finalAmount: true },
    }),
    prisma.payment.aggregate({
      where: { gymId, status: 'paid', paidAt: { gte: startOfMonth } },
      _sum: { finalAmount: true },
    }),
    prisma.payment.aggregate({
      where: { gymId, status: 'pending' },
      _sum: { finalAmount: true },
    }),
  ])

  return {
    payments,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    stats: {
      today: todayAgg._sum.finalAmount || 0,
      month: monthAgg._sum.finalAmount || 0,
      pending: pendingAgg._sum.finalAmount || 0,
    },
  }
}

export async function getRecentPayments(gymId: string, limit = 5) {
  return prisma.payment.findMany({
    where: { gymId },
    orderBy: { paidAt: 'desc' },
    take: limit,
    include: {
      member: { select: { id: true, fullName: true } },
    },
  })
}

export async function getRecentMembers(gymId: string, limit = 5) {
  return prisma.member.findMany({
    where: { gymId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      fullName: true,
      phone: true,
      memberNumber: true,
      createdAt: true,
    },
  })
}

// ========================================
// GYM PLANS (subscription plans offered by the gym)
// ========================================

export async function getGymPlans(gymId: string) {
  return prisma.gymPlan.findMany({
    where: { gymId },
    orderBy: { price: 'asc' },
  })
}

// ========================================
// REPORTS
// ========================================

export interface ReportsData {
  // Monthly revenue for the last N months (mirrors getRevenueChart shape)
  revenueChart: { month: string; revenue: number; label: string }[]
  // Revenue grouped by payment method (paid only, last 12 months)
  revenueByMethod: { method: string; total: number; count: number }[]
  // Member growth: new members per month for the last N months
  memberGrowth: { month: string; newMembers: number; label: string }[]
  // Subscription status breakdown (current snapshot)
  subscriptionsByStatus: { status: string; count: number }[]
  // Totals
  totals: {
    allTimeRevenue: number
    totalMembers: number
    activeSubs: number
  }
}

export async function getReports(gymId: string, months = 6): Promise<ReportsData> {
  const now = new Date()
  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ]

  // 1. Revenue chart (reuse existing helper for consistency)
  const revenueChart = await getRevenueChart(gymId, months)

  // 2. Revenue by payment method — last 12 months, paid only
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
  const methodGroups = await prisma.payment.groupBy({
    by: ['method'],
    where: { gymId, status: 'paid', paidAt: { gte: twelveMonthsAgo } },
    _sum: { finalAmount: true },
    _count: true,
  })
  const revenueByMethod = methodGroups.map((g) => ({
    method: g.method,
    total: g._sum.finalAmount || 0,
    count: g._count,
  }))

  // 3. Member growth — build windows upfront, fire all counts in parallel
  const memberWindows = Array.from({ length: months }, (_, idx) => {
    const i = months - 1 - idx
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    return { start, end }
  })
  const memberCounts = await Promise.all(
    memberWindows.map(({ start, end }) =>
      prisma.member.count({
        where: { gymId, createdAt: { gte: start, lt: end } },
      })
    )
  )
  const memberGrowth = memberWindows.map(({ start }, idx) => ({
    month: `${start.getFullYear()}-${start.getMonth() + 1}`,
    newMembers: memberCounts[idx],
    label: monthNames[start.getMonth()],
  }))

  // 4. Subscriptions by status (snapshot)
  const statusGroups = await prisma.subscription.groupBy({
    by: ['status'],
    where: { gymId },
    _count: true,
  })
  const subscriptionsByStatus = statusGroups.map((g) => ({
    status: g.status,
    count: g._count,
  }))

  // 5. Totals
  const [allTimeAgg, totalMembers, activeSubs] = await Promise.all([
    prisma.payment.aggregate({
      where: { gymId, status: 'paid' },
      _sum: { finalAmount: true },
    }),
    prisma.member.count({ where: { gymId, isActive: true } }),
    prisma.subscription.count({
      where: { gymId, status: 'active', endDate: { gte: now } },
    }),
  ])

  return {
    revenueChart,
    revenueByMethod,
    memberGrowth,
    subscriptionsByStatus,
    totals: {
      allTimeRevenue: allTimeAgg._sum.finalAmount || 0,
      totalMembers,
      activeSubs,
    },
  }
}

// ========================================
// EXPENSES
// ========================================

export interface ExpenseFilters {
  search?: string
  category?: string
  page?: number
  pageSize?: number
}

export async function getExpenses(gymId: string, filters: ExpenseFilters = {}) {
  const { search, category, page = 1, pageSize = 20 } = filters
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const where: Prisma.ExpenseWhereInput = {
    gymId,
    ...(category && { category }),
    ...(search && {
      OR: [
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  const [expenses, total, monthAgg, allTimeAgg] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({
      where: { gymId, date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { gymId },
      _sum: { amount: true },
    }),
  ])

  return {
    expenses,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    stats: {
      monthTotal: monthAgg._sum.amount || 0,
      allTimeTotal: allTimeAgg._sum.amount || 0,
    },
  }
}

// ========================================
// BRANCHES
// ========================================

export async function getBranches(gymId: string) {
  const branches = await prisma.branch.findMany({
    where: { gymId },
    orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
    include: {
      _count: {
        select: { members: true, profiles: true, classes: true },
      },
    },
  })

  const total = branches.length
  const totalMembers = branches.reduce((sum, b) => sum + b._count.members, 0)

  return { branches, total, totalMembers }
}

// ========================================
// STAFF (Profiles with gym_manager role)
// ========================================

export interface StaffFilters {
  search?: string
  page?: number
  pageSize?: number
}

export async function getStaff(gymId: string, filters: StaffFilters = {}) {
  const { search, page = 1, pageSize = 20 } = filters

  const where: Prisma.ProfileWhereInput = {
    gymId,
    role: 'gym_manager',
    isActive: true,
    ...(search && {
      OR: [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ],
    }),
  }

  const [staff, total] = await Promise.all([
    prisma.profile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.profile.count({ where }),
  ])

  return {
    staff,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

// ========================================
// TRAINERS (Profiles with trainer role)
// ========================================

export interface TrainerFilters {
  search?: string
  page?: number
  pageSize?: number
}

export async function getTrainers(gymId: string, filters: TrainerFilters = {}) {
  const { search, page = 1, pageSize = 20 } = filters

  const where: Prisma.ProfileWhereInput = {
    gymId,
    role: 'trainer',
    isActive: true,
    ...(search && {
      OR: [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ],
    }),
  }

  const [trainers, total, totalClasses, totalMembers] = await Promise.all([
    prisma.profile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.profile.count({ where }),
    prisma.classRoom.count({ where: { gymId, trainerId: { not: null } } }),
    prisma.member.count({ where: { gymId, trainerId: { not: null } } }),
  ])

  return {
    trainers,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    stats: { totalClasses, totalMembers },
  }
}

// ========================================
// CLASSES
// ========================================

export interface ClassFilters {
  search?: string
  active?: boolean
  page?: number
  pageSize?: number
}

export async function getClasses(gymId: string, filters: ClassFilters = {}) {
  const { search, active, page = 1, pageSize = 20 } = filters

  const where: Prisma.ClassRoomWhereInput = {
    gymId,
    ...(active !== undefined && { isActive: active }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  const [classes, total, activeCount] = await Promise.all([
    prisma.classRoom.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        trainer: { select: { id: true, fullName: true } },
        branch: { select: { id: true, name: true } },
        _count: { select: { bookings: true } },
      },
    }),
    prisma.classRoom.count({ where }),
    prisma.classRoom.count({ where: { gymId, isActive: true } }),
  ])

  return {
    classes,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    stats: { activeCount },
  }
}

export async function getClassBookings(classId: string, gymId: string) {
  const bookings = await prisma.classBooking.findMany({
    where: { classId, gymId },
    orderBy: { bookedAt: 'desc' },
    include: {
      member: { select: { id: true, fullName: true, phone: true } },
    },
    take: 50,
  })
  return bookings
}
