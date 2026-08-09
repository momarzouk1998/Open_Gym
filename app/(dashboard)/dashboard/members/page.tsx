'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useGymStore } from '@/store/gym-store'
import { formatDate } from '@/lib/utils'
import {
  Users,
  Plus,
  Search,
  Phone,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import { MembersTableSkeleton } from '@/components/ui/Skeleton'

interface MemberSub {
  id: string
  endDate: string
  status: string
}

interface Member {
  id: string
  memberNumber: string
  fullName: string
  phone: string | null
  gender: string | null
  isActive: boolean
  createdAt: string
  subscriptions: MemberSub[]
}

interface MembersResponse {
  members: Member[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function MembersPage() {
  const { gym } = useGymStore()
  const gymSlug = gym?.slug

  const [members, setMembers] = useState<Member[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>('')
  const [loading, setLoading] = useState(true)

  const fetchMembers = useCallback(
    async (p = 1, s = '', status = '', optimistic?: { id: string; memberNumber: string; fullName: string; phone: string | null; gender: string | null; isActive: boolean; createdAt: string; subscriptions: MemberSub[] }) => {
      if (!gymSlug) return
      setLoading(true)

      // Show optimistic row at top immediately
      if (optimistic) {
        setMembers((prev) => [optimistic, ...prev.filter((m) => m.id !== optimistic.id)])
      }

      const params = new URLSearchParams({ page: String(p) })
      if (s) params.set('search', s)
      if (status) params.set('status', status)

      try {
        const res = await fetch(`/api/gyms/${gymSlug}/members?${params}`)
        if (!res.ok) throw new Error('فشل تحميل الأعضاء')
        const data: MembersResponse = await res.json()
        setMembers(data.members)
        setTotal(data.total)
        setPage(data.page)
        setTotalPages(data.totalPages)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    },
    [gymSlug]
  )

  // Debounced search
  useEffect(() => {
    if (!gymSlug) return
    const timer = setTimeout(() => {
      fetchMembers(1, search, statusFilter)
    }, 350)
    return () => clearTimeout(timer)
  }, [search, statusFilter, gymSlug, fetchMembers])

  const getSubscriptionStatus = (subs: MemberSub[]) => {
    if (!subs || subs.length === 0)
      return { label: 'لا اشتراك', color: 'text-faint bg-[#64748B]/10' }
    const latest = subs[0]
    if (latest.status === 'frozen')
      return { label: 'مجمّد', color: 'text-[#3B82F6] bg-[#3B82F6]/10' }
    const endDate = new Date(latest.endDate)
    if (endDate < new Date())
      return { label: 'منتهي', color: 'text-[#EF4444] bg-[#EF4444]/10' }
    return { label: 'فعّال', color: 'text-[#22C55E] bg-[#22C55E]/10' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-cairo font-bold text-2xl">الأعضاء</h2>
          <p className="text-sm text-muted-c">إجمالي الأعضاء: {total}</p>
        </div>
        <Link
          href="/dashboard/members/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#22C55E] text-white rounded-xl text-sm font-semibold hover:bg-[#16A34A] transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة عضو
        </Link>
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
              placeholder="ابحث بالاسم أو التليفون أو رقم العضوية..."
              className="w-full bg-app border border-app rounded-xl py-3 pr-11 pl-4 text-strong placeholder:text-faint focus:outline-none focus:border-[#22C55E]/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'active' | 'inactive' | '')}
            className="bg-app border border-app rounded-xl py-3 px-4 text-strong focus:outline-none focus:border-[#22C55E]/50 sm:w-44"
          >
            <option value="">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading && members.length === 0 ? (
        <MembersTableSkeleton />
      ) : (
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="surface text-sm text-faint">
              <tr>
                <th className="p-4 font-medium">رقم العضوية</th>
                <th className="p-4 font-medium">الاسم</th>
                <th className="p-4 font-medium">التليفون</th>
                <th className="p-4 font-medium">تاريخ الانتهاء</th>
                <th className="p-4 font-medium">الحالة</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? null : members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-faint">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg mb-1">مفيش أعضاء بعد</p>
                    <p className="text-sm">ابدأ بإضافة أول عضو في جيمك</p>
                    <Link
                      href="/dashboard/members/new"
                      className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-[#22C55E] text-white rounded-xl text-sm font-semibold hover:bg-[#16A34A] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة أول عضو
                    </Link>
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const subStatus = getSubscriptionStatus(member.subscriptions)
                  const latestSub = member.subscriptions[0]
                  return (
                    <tr
                      key={member.id}
                      className="border-t border-app hover:surface transition-colors"
                    >
                      <td className="p-4">
                        <span className="font-mono text-sm text-muted-c" dir="ltr">
                          {member.memberNumber}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{member.fullName}</div>
                        {!member.isActive && (
                          <span className="text-xs text-[#EF4444]">محذوف</span>
                        )}
                      </td>
                      <td className="p-4">
                        {member.phone ? (
                          <a
                            href={`tel:${member.phone}`}
                            className="flex items-center gap-1 text-muted-c hover:text-[#22C55E] transition-colors"
                            dir="ltr"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {member.phone}
                          </a>
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-c">
                        {latestSub ? formatDate(latestSub.endDate) : '—'}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${subStatus.color}`}
                        >
                          {subStatus.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/dashboard/members/${member.id}`}
                          className="text-[#22C55E] hover:text-[#16A34A] text-sm font-medium"
                        >
                          عرض
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => fetchMembers(page - 1, search, statusFilter)}
            disabled={page === 1}
            className="p-2 rounded-lg border border-app disabled:opacity-30 hover:surface transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="px-4 py-2 text-sm text-muted-c">
            صفحة {page} من {totalPages}
          </span>
          <button
            onClick={() => fetchMembers(page + 1, search, statusFilter)}
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
