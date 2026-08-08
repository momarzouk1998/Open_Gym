'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGymStore } from '@/store/gym-store'
import { formatDate } from '@/lib/utils'
import { ListPageSkeleton } from '@/components/ui/Skeleton'
import { History, Shield, ChevronRight, ChevronLeft, User, Activity } from 'lucide-react'

interface AuditLogItem {
  id: string
  action: string
  entityType: string
  entityId: string | null
  meta: any
  ip: string | null
  createdAt: string
  user: {
    fullName: string | null
    role: string
  }
}

const actionLabels: Record<string, { label: string; color: string }> = {
  'member.create': { label: 'إضافة عضو', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  'member.update': { label: 'تعديل عضو', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  'member.delete': { label: 'حذف عضو', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  'subscription.create': { label: 'اشتراك جديد', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  'subscription.freeze': { label: 'تجميد اشتراك', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  'subscription.unfreeze': { label: 'تنشيط اشتراك', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  'subscription.cancel': { label: 'إلغاء اشتراك', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  'payment.create': { label: 'إضافة دفعة', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  'payment.delete': { label: 'حذف دفعة', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  'expense.create': { label: 'إضافة مصروف', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  'expense.delete': { label: 'حذف مصروف', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  'staff.create': { label: 'إضافة موظف', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  'staff.delete': { label: 'حذف موظف', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  'plan.create': { label: 'إضافة خطة', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  'gym.update': { label: 'تعديل الجيم', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
}

export default function AuditLogsPage() {
  const { gym } = useGymStore()
  const gymSlug = gym?.slug

  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(
    async (p = 1) => {
      if (!gymSlug) return
      setLoading(true)
      try {
        const res = await fetch(`/api/gyms/${gymSlug}/audit-logs?page=${p}`)
        if (!res.ok) throw new Error('فشل تحميل سجل العمليات')
        const data = await res.json()
        setLogs(data.logs || [])
        setTotal(data.total || 0)
        setPage(data.page || 1)
        setTotalPages(data.totalPages || 1)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    },
    [gymSlug]
  )

  useEffect(() => {
    fetchLogs(page)
  }, [fetchLogs, page])

  if (loading && logs.length === 0) {
    return <ListPageSkeleton rows={10} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-[#22C55E]" />
            <h1 className="font-cairo font-bold text-2xl">سجل العمليات (Audit Logs)</h1>
          </div>
          <p className="text-sm text-muted-c mt-1">
            سجل كشف الحركات والأنشطة التي تمت داخل النظام للمتابعة والأمان
          </p>
        </div>
        <div className="glass-card px-4 py-2 rounded-xl text-xs text-muted-c flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#22C55E]" />
          <span>إجمالي العمليات: <strong className="text-strong">{total}</strong></span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Activity className="w-12 h-12 text-faint mb-3" />
            <p className="text-muted-c font-medium">لا توجد عمليات مسجلة حتى الآن</p>
            <p className="text-xs text-faint mt-1">ستظهر هنا الأنشطة والتغييرات التي يتم إجراؤها فور حدوثها</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="surface text-xs text-faint">
                <tr>
                  <th className="p-4 font-medium">العملية</th>
                  <th className="p-4 font-medium">المستخدم</th>
                  <th className="p-4 font-medium">التفاصيل</th>
                  <th className="p-4 font-medium">التاريخ والوقت</th>
                  <th className="p-4 font-medium">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app">
                {logs.map((log) => {
                  const actionInfo = actionLabels[log.action] || {
                    label: log.action,
                    color: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
                  }
                  return (
                    <tr key={log.id} className="hover:surface/50 transition-colors">
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${actionInfo.color}`}>
                          {actionInfo.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-faint" />
                          <span className="font-medium text-strong">{log.user.fullName || 'مالك النظام'}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-muted-c max-w-xs truncate">
                        {log.meta ? JSON.stringify(log.meta).replaceAll('"', '') : '-'}
                      </td>
                      <td className="p-4 text-xs text-muted-c dir-ltr">
                        {new Date(log.createdAt).toLocaleString('ar-EG', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="p-4 text-xs text-faint font-mono">
                        {log.ip || '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-app flex items-center justify-between">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-app text-xs disabled:opacity-40 hover:surface"
            >
              <ChevronRight className="w-4 h-4" />
              السابق
            </button>
            <span className="text-xs text-muted-c">
              صفحة {page} من {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-app text-xs disabled:opacity-40 hover:surface"
            >
              التالي
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
