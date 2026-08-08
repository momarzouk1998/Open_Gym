import { NextResponse } from 'next/server'
import { getGymContextApi } from '@/lib/gym-context'
import { getExpenses } from '@/lib/queries'
import { prisma } from '@/lib/prisma'
import { auditFromRequest } from '@/lib/audit'

// GET /api/gyms/[gymSlug]/expenses?search=&category=&page=
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
  const search = searchParams.get('search') || undefined
  const category = searchParams.get('category') || undefined
  const page = parseInt(searchParams.get('page') || '1')

  const result = await getExpenses(gym.id, { search, category, page })
  return NextResponse.json(result)
}

// POST /api/gyms/[gymSlug]/expenses
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
  const { category, amount, description, date, branchId } = body

  if (!category?.trim()) {
    return NextResponse.json({ error: 'التصنيف مطلوب' }, { status: 400 })
  }
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'المبلغ مطلوب' }, { status: 400 })
  }

  const expense = await prisma.expense.create({
    data: {
      gymId: gym.id,
      category: category.trim(),
      amount: parseFloat(amount),
      description: description || null,
      date: date ? new Date(date) : new Date(),
      branchId: branchId || null,
      createdBy: userId || null,
    },
  })

  void auditFromRequest(request, gym.id, userId, 'expense.create', 'expense', expense.id, {
    category: expense.category,
    amount: expense.amount,
  })

  return NextResponse.json({ success: true, expense }, { status: 201 })
}
