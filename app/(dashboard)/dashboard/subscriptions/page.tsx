'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGymStore } from '@/store/gym-store'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ListPageSkeleton } from '@/components/ui/Skeleton'
import {
  CreditCard,
  Search,
  Loader2,
  Snowflake,
  Play,
  XCircle,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react'

interface GymPlan {
  id: string
  name: string
  duration: number
  price: number
}

interface Subscription {
  id: string
  startDate: string
  endDate: string
  price: number
  discount: number
  finalPrice: number
  status: string
  frozenAt: string | null
  member: { id: string; fullName: string; phone: string | null; memberNumber: string }
  plan: { id: string; name: string; duration: number }
}

interface SubsResponse {
  subscriptions: Subscription[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  stats: { active: number; expired: number; frozen: number }
}

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'فعّال', color: 'text-[#22C55E] bg-[#22C55E]/10' },
  expired: { label: 'منتهي', color: 'text-[#EF4444] bg-[#EF4444]/10' },
  frozen: { label: 'مجمّد', color: 'text-[#3B82F6] bg-[#3B82F6]/10' },
  cancelled: { label: 'ملغي', color: 'text-faint bg-[#64748B]/10' },
}

export default function SubscriptionsPage() {
  const { gym } = useGymStore()
  const gymSlug = gym?.slug

  const [subs, setSubs] = useState<Subscription[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({ active: 0, expired: 0, frozen: 0 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Renewal modal state
  const [renewSub, setRenewSub] = useState<Subscription | null>(null)
  const [plans, setPlans] = useState<GymPlan[]>([])
  const [renewForm, setRenewForm] = useState({
    planId: '',
    startDate: new Date().toISOString().split('T')[0],
    discount: '',
    method: 'cash',
  })
  const [renewLoading, setRenewLoading] = useState(false)
  const [renewError, setRenewError] = useState('')

  const fetchSubs = useCallback(
    async (p = 1, s = '', status = 'all') => {
      if (!gymSlug) return
      setLoading(true)

      const params = new URLSearchParams({ page: String(p), status })
      if (s) params.set('search', s)

      try {
        const res = await fetch(`/api/gyms/${gymSlug}/subscriptions?${params}`)
        if (!res.ok) throw new Error('فشل تحميل الاشتراكات')
        const data: SubsResponse = await res.json()
        setSubs(data.subscriptions)
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
      fetchSubs(1, search, statusFilter)
    }, 350)
    return () => clearTimeout(timer)
  }, [search, statusFilter, gymSlug, fetchSubs])

  const handleAction = async (subId: string, action: 'freeze' | 'unfreeze' | 'cancel') => {
    if (!gymSlug) return
    setActionLoading(subId)
    try {
      const res = await fetch(`/api/gyms/${gymSlug}/subscriptions/${subId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'فشل الإجراء')
      }
      // Refetch current view
      fetchSubs(page, search, statusFilter)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setActionLoading(null)
    }
  }

  // Open the renewal modal for a given subscription, pre-selecting its plan.
  // Loads gym plans lazily on first open.
  const openRenew = async (sub: Subscription) => {
    setRenewSub(sub)
    setRenewError('')
    // Default start date = today (so a new endDate is computed from plan.duration).
    setRenewForm({
      planId: sub.plan.id,
      startDate: new Date().toISOString().split('T')[0],
      discount: '',
      method: 'cash',
    })
    if (plans.length === 0 && gymSlug) {
      try {
        const res = await fetch(`/api/gyms/${gymSlug}/plans`)
        const data = await res.json()
        setPlans(Array.isArray(data) ? data : [])
      } catch {
        /* ignore — modal will show "no plans" state */
      }
    }
  }

  const closeRenew = () => {
    setRenewSub(null)
    setRenewError('')
    setRenewLoading(false)
  }

  // Submit renewal: POST /subscriptions creates a fresh active subscription
  // (with computed endDate = startDate + plan.duration) and a payment in one tx.
  const handleRenew = async () => {
    if (!gymSlug || !renewSub) return
    setRenewLoading(true)
    setRenewError('')
    try {
      const discount = renewForm.discount ? parseFloat(renewForm.discount) || 0 : 0
      const res = await fetch(`/api/gyms/${gymSlug}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: renewSub.member.id,
          planId: renewForm.planId,
          startDate: renewForm.startDate,
          discount: discount || undefined,
          method: renewForm.method,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'فشل التجديد')
      }
      closeRenew()
      fetchSubs(page, search, statusFilter)
    } catch (err) {
      setRenewError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setRenewLoading(false)
    }
  }

  const statCards = [
    { label: 'فعّالة', value: stats.active, color: 'text-[#22C55E]' },
    { label: 'منتهية', value: stats.expired, color: 'text-[#EF4444]' },
    { label: 'مجمّدة', value: stats.frozen, color: 'text-[#3B82F6]' },
    { label: 'الإجمالي', value: total, color: 'text-[#F59E0B]' },
  ]

  const inputClass =
    'w-full bg-app border border-app rounded-xl py-3 px-4 text-strong focus:outline-none focus:border-[#22C55E]/50 focus:ring-2 focus:ring-[#22C55E]/20'

  if (loading && subs.length === 0) {
    return <ListPageSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-cairo font-bold text-2xl">الاشتراكات</h2>
        <p className="text-sm text-muted-c">إدارة اشتراكات الأعضاء</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="glass-card p-5 rounded-2xl">
            <div className={`text-3xl font-bold font-cairo mb-1 ${stat.color}`}>
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-app border border-app rounded-xl py-3 px-4 text-strong focus:outline-none focus:border-[#22C55E]/50 sm:w-44"
          >
            <option value="all">كل الحالات</option>
            <option value="active">فعّال</option>
            <option value="expired">منتهي</option>
            <option value="frozen">مجمّد</option>
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
                <th className="p-4 font-medium">الخطة</th>
                <th className="p-4 font-medium">البداية</th>
                <th className="p-4 font-medium">النهاية</th>
                <th className="p-4 font-medium">المبلغ</th>
                <th className="p-4 font-medium">الحالة</th>
                <th className="p-4 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center">
                    <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-[#22C55E]" />
                    <p className="text-faint">جاري التحميل...</p>
                  </td>
                </tr>
              ) : subs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center text-faint">
                    <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg mb-1">مفيش اشتراكات</p>
                    <p className="text-sm">أضف اشتراك من خلال إضافة عضو جديد</p>
                  </td>
                </tr>
              ) : (
                subs.map((sub) => {
                  const st = statusConfig[sub.status] || statusConfig.active
                  return (
                    <tr
                      key={sub.id}
                      className="border-t border-app hover:surface transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-medium">{sub.member.fullName}</div>
                        <div className="text-xs text-faint font-mono" dir="ltr">
                          {sub.member.memberNumber}
                        </div>
                      </td>
                      <td className="p-4 text-sm">{sub.plan.name}</td>
                      <td className="p-4 text-sm text-muted-c">
                        {formatDate(sub.startDate)}
                      </td>
                      <td className="p-4 text-sm text-muted-c">
                        {formatDate(sub.endDate)}
                      </td>
                      <td className="p-4 font-medium text-[#22C55E]">
                        {formatCurrency(sub.finalPrice)}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${st.color}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {/* Renew — available for every status (active, expired, frozen) */}
                          <button
                            onClick={() => openRenew(sub)}
                            title="تجديد"
                            className="p-1.5 rounded-lg text-[#22C55E] hover:bg-[#22C55E]/10"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          {sub.status === 'active' && (
                            <button
                              onClick={() => handleAction(sub.id, 'freeze')}
                              disabled={actionLoading === sub.id}
                              title="تجميد"
                              className="p-1.5 rounded-lg text-[#3B82F6] hover:bg-[#3B82F6]/10 disabled:opacity-50"
                            >
                              <Snowflake className="w-4 h-4" />
                            </button>
                          )}
                          {sub.status === 'frozen' && (
                            <button
                              onClick={() => handleAction(sub.id, 'unfreeze')}
                              disabled={actionLoading === sub.id}
                              title="إلغاء التجميد"
                              className="p-1.5 rounded-lg text-[#22C55E] hover:bg-[#22C55E]/10 disabled:opacity-50"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          {(sub.status === 'active' || sub.status === 'frozen') && (
                            <button
                              onClick={() => handleAction(sub.id, 'cancel')}
                              disabled={actionLoading === sub.id}
                              title="إلغاء"
                              className="p-1.5 rounded-lg text-[#EF4444] hover:bg-[#EF4444]/10 disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renewal Modal */}
      {renewSub && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={closeRenew}
        >
          <div
            className="glass-card w-full max-w-lg rounded-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-[#22C55E]" />
                </div>
                <div>
                  <h3 className="font-cairo font-bold text-lg">تجديد الاشتراك</h3>
                  <p className="text-sm text-muted-c">
                    {renewSub.member.fullName} ·{' '}
                    <span className="font-mono" dir="ltr">
                      {renewSub.member.memberNumber}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={closeRenew}
                className="p-1.5 rounded-lg text-faint hover:surface-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renewError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {renewError}
              </div>
            )}

            {plans.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#F59E0B] text-sm text-center">
                مفيش خطط متاحة. اتصل بالأدمن لإضافة خطط.
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Plan */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-2 text-soft">
                      الخطة *
                    </label>
                    <select
                      value={renewForm.planId}
                      onChange={(e) =>
                        setRenewForm({ ...renewForm, planId: e.target.value })
                      }
                      className={inputClass}
                    >
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {formatCurrency(p.price)} ({p.duration} يوم)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start date */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-soft">
                      تاريخ البداية *
                    </label>
                    <input
                      type="date"
                      required
                      dir="ltr"
                      value={renewForm.startDate}
                      onChange={(e) =>
                        setRenewForm({ ...renewForm, startDate: e.target.value })
                      }
                      className={`${inputClass} text-left`}
                    />
                  </div>

                  {/* Discount */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-soft">
                      الخصم (جنيه)
                    </label>
                    <input
                      type="number"
                      min="0"
                      dir="ltr"
                      value={renewForm.discount}
                      onChange={(e) =>
                        setRenewForm({ ...renewForm, discount: e.target.value })
                      }
                      className={`${inputClass} text-left`}
                      placeholder="0"
                    />
                  </div>

                  {/* Payment method */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-2 text-soft">
                      طريقة الدفع *
                    </label>
                    <select
                      value={renewForm.method}
                      onChange={(e) =>
                        setRenewForm({ ...renewForm, method: e.target.value })
                      }
                      className={inputClass}
                    >
                      <option value="cash">كاش</option>
                      <option value="instapay">انستاباي</option>
                      <option value="vodafone_cash">فودافون كاش</option>
                      <option value="bank_transfer">تحويل بنكي</option>
                    </select>
                  </div>
                </div>

                {/* Computed end date + price summary */}
                {(() => {
                  const plan = plans.find((p) => p.id === renewForm.planId)
                  if (!plan) return null
                  const start = new Date(renewForm.startDate)
                  const end = new Date(start)
                  end.setDate(end.getDate() + plan.duration)
                  const discount = renewForm.discount
                    ? parseFloat(renewForm.discount) || 0
                    : 0
                  const finalPrice = Math.max(0, plan.price - discount)
                  return (
                    <div className="p-4 surface rounded-xl border border-app space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-c">تاريخ النهاية (مُحتسب)</span>
                        <span className="font-medium text-strong">
                          {formatDate(end.toISOString())}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-c">المبلغ المطلوب</span>
                        <div className="text-left">
                          <span className="text-lg font-bold font-cairo text-[#22C55E]">
                            {formatCurrency(finalPrice)}
                          </span>
                          {discount > 0 && (
                            <span className="text-xs text-faint line-through mr-2">
                              {formatCurrency(plan.price)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeRenew}
                    className="px-5 py-3 border border-app text-strong rounded-xl font-semibold hover:surface transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleRenew}
                    disabled={renewLoading || !renewForm.planId}
                    className="flex-1 py-3 bg-[#22C55E] text-white rounded-xl font-semibold hover:bg-[#16A34A] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {renewLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        جاري التجديد...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        تأكيد التجديد
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => fetchSubs(page - 1, search, statusFilter)}
            disabled={page === 1}
            className="p-2 rounded-lg border border-app disabled:opacity-30 hover:surface transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="px-4 py-2 text-sm text-muted-c">
            صفحة {page} من {totalPages}
          </span>
          <button
            onClick={() => fetchSubs(page + 1, search, statusFilter)}
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
