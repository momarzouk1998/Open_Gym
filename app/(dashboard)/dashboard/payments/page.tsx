'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGymStore } from '@/store/gym-store'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ListPageSkeleton } from '@/components/ui/Skeleton'
import {
  Wallet,
  Search,
  Loader2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'

interface Payment {
  id: string
  amount: number
  discount: number
  finalAmount: number
  method: string
  status: string
  paidAt: string
  notes: string | null
  member: { id: string; fullName: string; phone: string | null }
  subscription: { id: string; plan: { name: string } } | null
}

interface PaymentsResponse {
  payments: Payment[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  stats: { today: number; month: number; pending: number }
}

const methodLabels: Record<string, string> = {
  cash: 'كاش',
  instapay: 'انستاباي',
  vodafone_cash: 'فودافون كاش',
  bank_transfer: 'تحويل بنكي',
  other: 'أخرى',
}

const statusConfig: Record<string, { label: string; color: string }> = {
  paid: { label: 'مدفوع', color: 'text-[#22C55E] bg-[#22C55E]/10' },
  pending: { label: 'معلّق', color: 'text-[#F59E0B] bg-[#F59E0B]/10' },
  partial: { label: 'جزئي', color: 'text-[#3B82F6] bg-[#3B82F6]/10' },
  refunded: { label: 'مسترد', color: 'text-[#EF4444] bg-[#EF4444]/10' },
}

export default function PaymentsPage() {
  const { gym } = useGymStore()
  const gymSlug = gym?.slug

  const [payments, setPayments] = useState<Payment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({ today: 0, month: 0, pending: 0 })
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchPayments = useCallback(
    async (p = 1, s = '', method = '', status = 'all') => {
      if (!gymSlug) return
      setLoading(true)

      const params = new URLSearchParams({ page: String(p), status })
      if (s) params.set('search', s)
      if (method) params.set('method', method)

      try {
        const res = await fetch(`/api/gyms/${gymSlug}/payments?${params}`)
        if (!res.ok) throw new Error('فشل تحميل المدفوعات')
        const data: PaymentsResponse = await res.json()
        setPayments(data.payments)
        setTotal(data.total)
        setPage(data.page)
        setTotalPages(data.totalPages)
        setStats(data.stats)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    },
    [gymSlug]
  )

  useEffect(() => {
    if (!gymSlug) return
    const timer = setTimeout(() => {
      fetchPayments(1, search, methodFilter)
    }, 350)
    return () => clearTimeout(timer)
  }, [search, methodFilter, gymSlug, fetchPayments])

  const statCards = [
    { label: 'إيرادات اليوم', value: formatCurrency(stats.today), color: 'text-[#22C55E]' },
    { label: 'إيرادات الشهر', value: formatCurrency(stats.month), color: 'text-[#4ADE80]' },
    { label: 'معلّق', value: formatCurrency(stats.pending), color: 'text-[#F59E0B]' },
    { label: 'إجمالي العمليات', value: String(total), color: 'text-muted-c' },
  ]

  if (loading && payments.length === 0) {
    return <ListPageSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-cairo font-bold text-2xl">المدفوعات</h2>
        <p className="text-sm text-muted-c">سجل جميع المدفوعات</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="glass-card p-5 rounded-2xl">
            <div className={`text-2xl font-bold font-cairo mb-1 ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-sm text-muted-c">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="glass-card p-4 rounded-2xl">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-faint" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم العضو أو التليفون..."
              className="w-full bg-app border border-app rounded-xl py-3 pr-11 pl-4 text-strong placeholder:text-faint focus:outline-none focus:border-[#22C55E]/50"
            />
          </div>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-app border border-app rounded-xl py-3 px-4 text-strong focus:outline-none focus:border-[#22C55E]/50 sm:w-48"
          >
            <option value="">كل الطرق</option>
            <option value="cash">كاش</option>
            <option value="instapay">انستاباي</option>
            <option value="vodafone_cash">فودافون كاش</option>
            <option value="bank_transfer">تحويل بنكي</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="surface text-sm text-faint">
              <tr>
                <th className="p-4 font-medium">العضو</th>
                <th className="p-4 font-medium">المبلغ</th>
                <th className="p-4 font-medium">طريقة الدفع</th>
                <th className="p-4 font-medium">التاريخ</th>
                <th className="p-4 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center">
                    <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-[#22C55E]" />
                    <p className="text-faint">جاري التحميل...</p>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-faint">
                    <Wallet className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg mb-1">مفيش مدفوعات بعد</p>
                    <p className="text-sm">
                      المدفوعات تُسجّل تلقائياً عند إنشاء اشتراك جديد
                    </p>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const st = statusConfig[payment.status] || statusConfig.paid
                  return (
                    <tr
                      key={payment.id}
                      className="border-t border-app hover:surface transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-medium">{payment.member.fullName}</div>
                        {payment.subscription && (
                          <div className="text-xs text-faint">
                            {payment.subscription.plan.name}
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-medium text-[#22C55E]">
                        {formatCurrency(payment.finalAmount)}
                      </td>
                      <td className="p-4 text-sm text-muted-c">
                        {methodLabels[payment.method] || payment.method}
                      </td>
                      <td className="p-4 text-sm text-muted-c">
                        {formatDate(payment.paidAt)}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${st.color}`}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => fetchPayments(page - 1, search, methodFilter)}
            disabled={page === 1}
            className="p-2 rounded-lg border border-app disabled:opacity-30 hover:surface transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="px-4 py-2 text-sm text-muted-c">
            صفحة {page} من {totalPages}
          </span>
          <button
            onClick={() => fetchPayments(page + 1, search, methodFilter)}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-app disabled:opacity-30 hover:surface transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
