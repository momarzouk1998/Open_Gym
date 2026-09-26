'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGymStore } from '@/store/gym-store'
import { formatCurrency } from '@/lib/utils'
import { Dumbbell, Plus, Search, Loader2, ChevronRight, ChevronLeft, Pencil, Trash2, X, Clock, Users, Tag, UserPlus, Phone } from 'lucide-react'

interface ClassItem {
  id: string
  name: string
  description: string | null
  capacity: number
  price: number
  dayOfWeek: number[]
  startTime: string | null
  duration: number | null
  isActive: boolean
  createdAt: string
  branchId: string | null
  trainerId: string | null
  trainer: { id: string; fullName: string | null } | null
  branch: { id: string; name: string } | null
  _count: { bookings: number }
}
interface ClassesResponse {
  classes: ClassItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  stats: { activeCount: number }
}
interface Option { id: string; name: string; fullName?: string | null }
interface BookingItem {
  id: string
  bookedAt: string
  attended: boolean
  member: { id: string; fullName: string; phone: string | null; memberNumber: string | null }
}

// 0=السبت ... 6=الجمعة (نظام أيام الأسبوع العربي)
const DAYS = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(iso))
  } catch {
    return '—'
  }
}

function daysLabel(days: number[] | null | undefined): string {
  if (!days || days.length === 0) return '—'
  return days.map((d) => DAYS[d] || String(d)).join('، ')
}

export default function ClassesPage() {
  const { gym } = useGymStore()
  const gymSlug = gym?.slug
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ activeCount: 0 })
  const [branches, setBranches] = useState<Option[]>([])
  const [trainers, setTrainers] = useState<Option[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ClassItem | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    capacity: '20',
    price: '0',
    dayOfWeek: [] as number[],
    startTime: '',
    duration: '',
    branchId: '',
    trainerId: '',
  })
  const [saving, setSaving] = useState(false)

  const [bookingsClass, setBookingsClass] = useState<ClassItem | null>(null)
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [memberResults, setMemberResults] = useState<Option[]>([])
  const [addingBooking, setAddingBooking] = useState(false)
  const [bookingError, setBookingError] = useState('')

  const fetchClasses = useCallback(async (p = 1, s = '', a: 'all' | 'active' | 'inactive' = 'all') => {
    if (!gymSlug) return
    setLoading(true)
    const params = new URLSearchParams({ page: String(p) })
    if (s) params.set('search', s)
    if (a === 'active') params.set('active', 'true')
    if (a === 'inactive') params.set('active', 'false')
    try {
      const res = await fetch(`/api/gyms/${gymSlug}/classes?${params}`)
      if (!res.ok) throw new Error()
      const data: ClassesResponse = await res.json()
      setClasses(data.classes); setTotal(data.total); setPage(data.page); setTotalPages(data.totalPages)
      setStats(data.stats)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }, [gymSlug])

  const fetchOptions = useCallback(async () => {
    if (!gymSlug) return
    try {
      const [bRes, tRes] = await Promise.all([
        fetch(`/api/gyms/${gymSlug}/branches`),
        fetch(`/api/gyms/${gymSlug}/trainers`),
      ])
      if (bRes.ok) {
        const bd = await bRes.json()
        setBranches(bd.branches || [])
      }
      if (tRes.ok) {
        const td = await tRes.json()
        setTrainers(td.trainers || [])
      }
    } catch { /* ignore */ }
  }, [gymSlug])

  useEffect(() => { if (gymSlug) fetchOptions() }, [gymSlug, fetchOptions])

  useEffect(() => {
    if (!gymSlug) return
    const timer = setTimeout(() => fetchClasses(1, search, activeFilter), 350)
    return () => clearTimeout(timer)
  }, [search, activeFilter, gymSlug, fetchClasses])

  const fetchBookings = useCallback(async (classId: string) => {
    if (!gymSlug) return
    setBookingsLoading(true)
    try {
      const res = await fetch(`/api/gyms/${gymSlug}/classes/${classId}/bookings`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setBookings(data.bookings || [])
    } catch (err) { console.error(err) } finally { setBookingsLoading(false) }
  }, [gymSlug])

  const openBookings = (c: ClassItem) => {
    setBookingsClass(c)
    setMemberSearch('')
    setMemberResults([])
    setBookingError('')
    fetchBookings(c.id)
  }

  useEffect(() => {
    if (!bookingsClass || !gymSlug || !memberSearch.trim()) return
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/gyms/${gymSlug}/members?search=${encodeURIComponent(memberSearch)}&limit=8`)
        if (!res.ok) return
        const data = await res.json()
        setMemberResults((data.members || []).map((m: { id: string; fullName: string }) => ({ id: m.id, name: m.fullName })))
      } catch { /* ignore */ }
    }, 300)
    return () => clearTimeout(timer)
  }, [memberSearch, bookingsClass, gymSlug])

  const handleAddBooking = async (memberId: string) => {
    if (!gymSlug || !bookingsClass) return
    setAddingBooking(true)
    setBookingError('')
    try {
      const res = await fetch(`/api/gyms/${gymSlug}/classes/${bookingsClass.id}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل الحجز')
      setMemberSearch('')
      setMemberResults([])
      await fetchBookings(bookingsClass.id)
      fetchClasses(page, search, activeFilter)
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'فشل الحجز')
    } finally {
      setAddingBooking(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!gymSlug || !bookingsClass) return
    try {
      const res = await fetch(`/api/gyms/${gymSlug}/classes/${bookingsClass.id}/bookings/${bookingId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      await fetchBookings(bookingsClass.id)
      fetchClasses(page, search, activeFilter)
    } catch (err) { console.error(err) }
  }

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', description: '', capacity: '20', price: '0', dayOfWeek: [], startTime: '', duration: '', branchId: '', trainerId: '' })
    setModalOpen(true)
  }
  const openEdit = (c: ClassItem) => {
    setEditing(c)
    // استخراج وقت البداية بصيغة HH:MM للـ input
    let stTime = ''
    if (c.startTime) {
      try {
        const d = new Date(c.startTime)
        stTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      } catch { stTime = '' }
    }
    setForm({
      name: c.name,
      description: c.description || '',
      capacity: String(c.capacity),
      price: String(c.price),
      dayOfWeek: c.dayOfWeek || [],
      startTime: stTime,
      duration: c.duration ? String(c.duration) : '',
      branchId: c.branchId || '',
      trainerId: c.trainerId || '',
    })
    setModalOpen(true)
  }

  const toggleDay = (day: number) => {
    setForm((f) => ({
      ...f,
      dayOfWeek: f.dayOfWeek.includes(day) ? f.dayOfWeek.filter((d) => d !== day) : [...f.dayOfWeek, day].sort(),
    }))
  }

  const handleSave = async () => {
    if (!gymSlug || !form.name.trim()) return
    setSaving(true)
    try {
      // تحويل وقت HH:MM إلى ISO (تاريخ اليوم + الوقت)
      let startIso: string | null = null
      if (form.startTime) {
        const [hh, mm] = form.startTime.split(':')
        const d = new Date()
        d.setHours(parseInt(hh) || 0, parseInt(mm) || 0, 0, 0)
        startIso = d.toISOString()
      }
      const payload = {
        name: form.name.trim(),
        description: form.description || null,
        capacity: form.capacity || '20',
        price: form.price || '0',
        dayOfWeek: form.dayOfWeek,
        startTime: startIso,
        duration: form.duration || null,
        branchId: form.branchId || null,
        trainerId: form.trainerId || null,
      }
      const url = editing ? `/api/gyms/${gymSlug}/classes/${editing.id}` : `/api/gyms/${gymSlug}/classes`
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      setModalOpen(false)
      fetchClasses(page, search, activeFilter)
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!gymSlug || !confirm('هل أنت متأكد من إيقاف/حذف هذا الكلاس؟')) return
    try {
      const res = await fetch(`/api/gyms/${gymSlug}/classes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      fetchClasses(page, search, activeFilter)
    } catch (err) { console.error(err) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-cairo font-bold text-2xl">الكلاسات</h2>
          <p className="text-sm text-muted-c">إجمالي الكلاسات: {total}</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#22C55E] text-white rounded-xl text-sm font-semibold hover:bg-[#16A34A] transition-colors">
          <Plus className="w-4 h-4" /> إضافة كلاس
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl">
          <p className="text-sm text-faint mb-1">إجمالي الكلاسات</p>
          <p className="text-xl font-bold text-strong">{total}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl">
          <p className="text-sm text-faint mb-1">الكلاسات النشطة</p>
          <p className="text-xl font-bold text-[#22C55E]">{stats.activeCount}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl">
          <p className="text-sm text-faint mb-1">الكلاسات المتوقفة</p>
          <p className="text-xl font-bold text-[#EF4444]">{Math.max(0, total - stats.activeCount)}</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="glass-card p-4 rounded-2xl space-y-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-faint" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث باسم الكلاس أو الوصف..." className="w-full bg-app border border-app rounded-xl py-3 pr-11 pl-4 text-strong placeholder:text-faint focus:outline-none focus:border-[#22C55E]/50" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setActiveFilter('all')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeFilter === 'all' ? 'bg-[#22C55E] text-white' : 'border border-app text-muted-c hover:surface'}`}>الكل</button>
          <button onClick={() => setActiveFilter('active')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeFilter === 'active' ? 'bg-[#22C55E] text-white' : 'border border-app text-muted-c hover:surface'}`}>نشط</button>
          <button onClick={() => setActiveFilter('inactive')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeFilter === 'inactive' ? 'bg-[#EF4444] text-white' : 'border border-app text-muted-c hover:surface'}`}>متوقف</button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="surface text-sm text-faint">
              <tr>
                <th className="p-4 font-medium">الكلاس</th>
                <th className="p-4 font-medium">المدرب</th>
                <th className="p-4 font-medium">الفرع</th>
                <th className="p-4 font-medium">السعة</th>
                <th className="p-4 font-medium">السعر</th>
                <th className="p-4 font-medium">الميعاد</th>
                <th className="p-4 font-medium">الحجوزات</th>
                <th className="p-4 font-medium">الحالة</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="p-16 text-center"><Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-[#22C55E]" /><p className="text-faint">جاري التحميل...</p></td></tr>
              ) : classes.length === 0 ? (
                <tr><td colSpan={9} className="p-16 text-center text-faint">
                  <Dumbbell className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg mb-1">مفيش كلاسات بعد</p>
                  <p className="text-sm">ابدأ بإضافة أول كلاس في جيمك</p>
                  <button onClick={openAdd} className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-[#22C55E] text-white rounded-xl text-sm font-semibold hover:bg-[#16A34A] transition-colors"><Plus className="w-4 h-4" /> إضافة أول كلاس</button>
                </td></tr>
              ) : classes.map((c) => (
                <tr key={c.id} className="border-t border-app hover:surface transition-colors">
                  <td className="p-4">
                    <p className="font-medium">{c.name}</p>
                    {c.description && <p className="text-xs text-faint mt-0.5 line-clamp-1">{c.description}</p>}
                  </td>
                  <td className="p-4 text-sm text-muted-c">{c.trainer?.fullName || '—'}</td>
                  <td className="p-4 text-sm text-muted-c">{c.branch?.name || '—'}</td>
                  <td className="p-4 text-sm text-muted-c">{c.capacity}</td>
                  <td className="p-4 text-sm text-muted-c">{formatCurrency(c.price)}</td>
                  <td className="p-4 text-sm text-muted-c">
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(c.startTime)}{c.duration ? ` (${c.duration}د)` : ''}</span>
                      <span className="text-xs text-faint">{daysLabel(c.dayOfWeek)}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    <button
                      onClick={() => openBookings(c)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:surface transition-colors text-[#22C55E] font-medium"
                      title="عرض/إدارة الحجوزات"
                    >
                      {c._count.bookings} / {c.capacity}
                    </button>
                  </td>
                  <td className="p-4">
                    {c.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#22C55E]/10 text-[#22C55E] text-xs font-semibold">نشط</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#EF4444]/10 text-[#EF4444] text-xs font-semibold">متوقف</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:surface transition-colors text-faint hover:text-[#22C55E]"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:surface transition-colors text-faint hover:text-[#EF4444]"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => fetchClasses(page - 1, search, activeFilter)} disabled={page === 1} className="p-2 rounded-lg border border-app disabled:opacity-30 hover:surface transition-colors"><ChevronRight className="w-4 h-4" /></button>
          <span className="px-4 py-2 text-sm text-muted-c">صفحة {page} من {totalPages}</span>
          <button onClick={() => fetchClasses(page + 1, search, activeFilter)} disabled={page === totalPages} className="p-2 rounded-lg border border-app disabled:opacity-30 hover:surface transition-colors"><ChevronLeft className="w-4 h-4" /></button>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-app border border-app rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between sticky top-0 bg-app pb-2">
              <h3 className="font-cairo font-bold text-lg">{editing ? 'تعديل الكلاس' : 'إضافة كلاس'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-faint hover:text-strong"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-faint mb-1">اسم الكلاس *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: كروس فيت، يوغا..." className="w-full bg-app border border-app rounded-xl py-3 px-4 text-strong placeholder:text-faint focus:outline-none focus:border-[#22C55E]/50" />
              </div>
              <div>
                <label className="block text-sm text-faint mb-1">الوصف</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="وصف الكلاس" rows={2} className="w-full bg-app border border-app rounded-xl py-3 px-4 text-strong placeholder:text-faint focus:outline-none focus:border-[#22C55E]/50 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-faint mb-1 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> السعة</label>
                  <input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="w-full bg-app border border-app rounded-xl py-3 px-4 text-strong focus:outline-none focus:border-[#22C55E]/50" />
                </div>
                <div>
                  <label className="block text-sm text-faint mb-1 flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> السعر (ج)</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full bg-app border border-app rounded-xl py-3 px-4 text-strong focus:outline-none focus:border-[#22C55E]/50" />
                </div>
              </div>

              {/* أيام الأسبوع */}
              <div>
                <label className="block text-sm text-faint mb-2">أيام الأسبوع</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((dayName, idx) => (
                    <button key={idx} type="button" onClick={() => toggleDay(idx)} className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${form.dayOfWeek.includes(idx) ? 'bg-[#22C55E] text-white' : 'border border-app text-muted-c hover:surface'}`}>{dayName}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-faint mb-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> وقت البداية</label>
                  <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full bg-app border border-app rounded-xl py-3 px-4 text-strong focus:outline-none focus:border-[#22C55E]/50" />
                </div>
                <div>
                  <label className="block text-sm text-faint mb-1">المدة (دقيقة)</label>
                  <input type="number" min="1" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="مثال: 60" className="w-full bg-app border border-app rounded-xl py-3 px-4 text-strong placeholder:text-faint focus:outline-none focus:border-[#22C55E]/50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-faint mb-1">الفرع</label>
                  <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} className="w-full bg-app border border-app rounded-xl py-3 px-4 text-strong focus:outline-none focus:border-[#22C55E]/50">
                    <option value="">بدون فرع</option>
                    {branches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-faint mb-1">المدرب</label>
                  <select value={form.trainerId} onChange={(e) => setForm({ ...form, trainerId: e.target.value })} className="w-full bg-app border border-app rounded-xl py-3 px-4 text-strong focus:outline-none focus:border-[#22C55E]/50">
                    <option value="">بدون مدرب</option>
                    {trainers.map((t) => (<option key={t.id} value={t.id}>{t.fullName || '—'}</option>))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2 sticky bottom-0 bg-app">
              <button onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1 py-2.5 bg-[#22C55E] text-white rounded-xl text-sm font-semibold hover:bg-[#16A34A] transition-colors disabled:opacity-50">{saving ? 'جاري الحفظ...' : 'حفظ'}</button>
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-app text-strong rounded-xl text-sm font-semibold hover:surface transition-colors">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {bookingsClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setBookingsClass(null)} />
          <div className="relative bg-app border border-app rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between sticky top-0 bg-app pb-2">
              <div>
                <h3 className="font-cairo font-bold text-lg">حجوزات: {bookingsClass.name}</h3>
                <p className="text-xs text-faint mt-0.5">{bookings.length} / {bookingsClass.capacity} محجوز</p>
              </div>
              <button onClick={() => setBookingsClass(null)} className="text-faint hover:text-strong"><X className="w-5 h-5" /></button>
            </div>

            {/* Add member */}
            <div className="space-y-2">
              <label className="block text-sm text-faint">إضافة عضو للكلاس</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => {
                    setMemberSearch(e.target.value)
                    if (!e.target.value.trim()) setMemberResults([])
                  }}
                  placeholder="ابحث بالاسم أو التليفون..."
                  disabled={bookings.length >= bookingsClass.capacity}
                  className="w-full bg-app border border-app rounded-xl py-2.5 pr-9 pl-3 text-strong placeholder:text-faint focus:outline-none focus:border-[#22C55E]/50 disabled:opacity-50"
                />
              </div>
              {bookings.length >= bookingsClass.capacity && (
                <p className="text-xs text-[#F59E0B]">الكلاس مكتمل العدد</p>
              )}
              {bookingError && <p className="text-xs text-[#EF4444]">{bookingError}</p>}
              {memberResults.length > 0 && (
                <div className="border border-app rounded-xl overflow-hidden divide-y divide-app">
                  {memberResults.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleAddBooking(m.id)}
                      disabled={addingBooking}
                      className="w-full flex items-center justify-between p-3 hover:surface transition-colors text-sm disabled:opacity-50"
                    >
                      <span>{m.name}</span>
                      <UserPlus className="w-4 h-4 text-[#22C55E]" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Booked members list */}
            <div className="space-y-2">
              {bookingsLoading ? (
                <div className="py-8 text-center"><Loader2 className="w-6 h-6 mx-auto animate-spin text-[#22C55E]" /></div>
              ) : bookings.length === 0 ? (
                <div className="py-8 text-center text-faint text-sm">مفيش أعضاء محجوزين في الكلاس ده لسه</div>
              ) : (
                bookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-xl border border-app">
                    <div>
                      <p className="text-sm font-medium">{b.member.fullName}</p>
                      {b.member.phone && (
                        <p className="text-xs text-faint flex items-center gap-1" dir="ltr"><Phone className="w-3 h-3" />{b.member.phone}</p>
                      )}
                    </div>
                    <button onClick={() => handleCancelBooking(b.id)} className="p-1.5 rounded-lg hover:surface transition-colors text-faint hover:text-[#EF4444]" title="إلغاء الحجز">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
