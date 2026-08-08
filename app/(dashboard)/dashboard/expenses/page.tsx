'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGymStore } from '@/store/gym-store'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ListPageSkeleton } from '@/components/ui/Skeleton'
import {
  Receipt,
  Plus,
  Search,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'

interface Expense {
  id: string
  category: string
  amount: number
  description: string | null
  date: string
  createdAt: string
}

interface ExpensesResponse {
  expenses: Expense[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  stats: { monthTotal: number; allTimeTotal: number }
}

const CATEGORIES = ['إيجار', 'مرتبات', 'كهرباء', 'مياه', 'صيانة', 'معدات', 'تسويق', 'أخرى']

export default function ExpensesPage() {
  const { gym } = useGymStore()
  const gymSlug = gym?.slug

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ monthTotal: 0, allTimeTotal: 0 })

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [form, setForm] = useState({ category: '', amount: '', description: '', date: '' })
  const [saving, setSaving] = useState(false)

  const fetchExpenses = useCallback(
    async (p = 1, s = '', cat = '') => {
      if (!gymSlug) return
      setLoading(true)
      const params = new URLSearchParams({ page: String(p) })
      if (s) params.set('search', s)
      if (cat) params.set('category', cat)
      try {
        const res = await fetch(`/api/gyms/${gymSlug}/expenses?${params}`)
        if (!res.ok) throw new Error('فشل تحميل المصروفات')
        const data: ExpensesResponse = await res.json()
        setExpenses(data.expenses)
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
    const timer = setTimeout(() => fetchExpenses(1, search, categoryFilter), 350)
    return () => clearTimeout(timer)
  }, [search, categoryFilter, gymSlug, fetchExpenses])

  const openAdd = () => {
    setEditing(null)
    setForm({ category: CATEGORIES[0], amount: '', description: '', date: new Date().toISOString().split('T')[0] })
    setModalOpen(true)
  }

  const openEdit = (e: Expense) => {
    setEditing(e)
    setForm({
      category: e.category,
      amount: String(e.amount),
      description: e.description || '',
      date: e.date ? new Date(e.date).toISOString().split('T')[0] : '',
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!gymSlug || !form.category || !form.amount) return
    setSaving(true)
    try {
      const url = editing
        ? `/api/gyms/${gymSlug}/expenses/${editing.id}`
        : `/api/gyms/${gymSlug}/expenses`
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: form.category,
          amount: parseFloat(form.amount),
          description: form.description || null,
          date: form.date || null,
        }),
      })
      if (!res.ok) throw new Error('فشل الحفظ')
      setModalOpen(false)
      fetchExpenses(page, search, categoryFilter)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!gymSlug || !confirm('هل أنت متأكد من حذف هذا المصروف؟')) return
    try {
      const res = await fetch(`/api/gyms/${gymSlug}/expenses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('فشل الحذف')
      fetchExpenses(page, search, categoryFilter)
    } catch (err) {
      console.error(err)
    }
  }

  if (loading && expenses.length === 0) {
    return <ListPageSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-cairo font-bold text-2xl">المصروفات</h2>
          <p className="text-sm text-muted-c">إجمالي المصروفات: {total}</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#22C55E] text-white rounded-xl text-sm font-semibold hover:bg-[#16A34A] transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة مصروف
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-4 rounded-2xl">
          <p className="text-sm text-faint mb-1">مصروفات الشهر الحالي</p>
          <p className="text-xl font-bold text-[#EF4444]">{formatCurrency(stats.monthTotal)}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl">
          <p className="text-sm text-faint mb-1">إجمالي المصروفات</p>
          <p className="text-xl font-bold text-[#EF4444]">{formatCurrency(stats.allTimeTotal)}</p>
        </div>
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
              placeholder="ابحث بالوصف أو التصنيف..."
              className="w-full bg-app border border-app rounded-xl py-3 pr-11 pl-4 text-strong placeholder:text-faint focus:outline-none focus:border-[#22C55E]/50"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-app border border-app rounded-xl py-3 px-4 text-strong focus:outline-none focus:border-[#22C55E]/50 sm:w-44"
          >
            <option value="">كل التصنيفات</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="surface text-sm text-faint">
              <tr>
                <th className="p-4 font-medium">التصنيف</th>
                <th className="p-4 font-medium">المبلغ</th>
                <th className="p-4 font-medium">الوصف</th>
                <th className="p-4 font-medium">التاريخ</th>
                <th className="p-4 font-medium"></th>
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
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-faint">
                    <Receipt className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg mb-1">مفيش مصروفات بعد</p>
                    <p className="text-sm">ابدأ بتسجيل أول مصروف في جيمك</p>
                    <button
                      onClick={openAdd}
                      className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-[#22C55E] text-white rounded-xl text-sm font-semibold hover:bg-[#16A34A] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة أول مصروف
                    </button>
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="border-t border-app hover:surface transition-colors">
                    <td className="p-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-[#F97316]/10 text-[#F97316]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-[#EF4444]">{formatCurrency(exp.amount)}</td>
                    <td className="p-4 text-sm text-muted-c">{exp.description || '—'}</td>
                    <td className="p-4 text-sm text-muted-c">{formatDate(exp.date)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(exp)} className="p-1.5 rounded-lg hover:surface transition-colors text-faint hover:text-[#22C55E]">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(exp.id)} className="p-1.5 rounded-lg hover:surface transition-colors text-faint hover:text-[#EF4444]">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => fetchExpenses(page - 1, search, categoryFilter)} disabled={page === 1} className="p-2 rounded-lg border border-app disabled:opacity-30 hover:surface transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="px-4 py-2 text-sm text-muted-c">صفحة {page} من {totalPages}</span>
          <button onClick={() => fetchExpenses(page + 1, search, categoryFilter)} disabled={page === totalPages} className="p-2 rounded-lg border border-app disabled:opacity-30 hover:surface transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-app border border-app rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-cairo font-bold text-lg">{editing ? 'تعديل المصروف' : 'إضافة مصروف'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-faint hover:text-strong"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-faint mb-1">التصنيف</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-app border border-app rounded-xl py-3 px-4 text-strong focus:outline-none focus:border-[#22C55E]/50">
                  {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-faint mb-1">المبلغ</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" className="w-full bg-app border border-app rounded-xl py-3 px-4 text-strong placeholder:text-faint focus:outline-none focus:border-[#22C55E]/50" />
              </div>
              <div>
                <label className="block text-sm text-faint mb-1">الوصف</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="وصف اختياري..." rows={2} className="w-full bg-app border border-app rounded-xl py-3 px-4 text-strong placeholder:text-faint focus:outline-none focus:border-[#22C55E]/50 resize-none" />
              </div>
              <div>
                <label className="block text-sm text-faint mb-1">التاريخ</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full bg-app border border-app rounded-xl py-3 px-4 text-strong focus:outline-none focus:border-[#22C55E]/50" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-[#22C55E] text-white rounded-xl text-sm font-semibold hover:bg-[#16A34A] transition-colors disabled:opacity-50">{saving ? 'جاري الحفظ...' : 'حفظ'}</button>
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-app text-strong rounded-xl text-sm font-semibold hover:surface transition-colors">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
