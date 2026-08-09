'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ADDONS } from '@/lib/addons'
import { PLANS as BILLING_PLANS, getAddonsForPlan, getPlanByPrice } from '@/lib/billing'
import {
  ArrowRight,
  Building2,
  Loader2,
  CheckCircle2,
  Save,
  Trash2,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  MessageSquare,
  Users,
  CreditCard,
  GitBranch,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react'

interface AdminGym {
  id: string
  name: string
  slug: string
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  phone: string | null
  city: string | null
  address: string | null
  status: string
  basePlanPrice: number
  addons: string[]
  billingCycle: string
  nextBillingDate: string | null
  trialEndsAt: string | null
  lastPaidAt: string | null
  createdAt: string
  adminNotes: string | null
  _count?: {
    members: number
    subscriptions: number
    branches: number
  }
}

const PLANS = [
  { key: BILLING_PLANS.starter.key, name: BILLING_PLANS.starter.name, price: BILLING_PLANS.starter.price },
  { key: BILLING_PLANS.pro.key,     name: BILLING_PLANS.pro.name,     price: BILLING_PLANS.pro.price     },
] as const

const STATUSES = [
  { value: 'active', label: '🟢 نشط (فعّال)' },
  { value: 'trial', label: '🟡 تجريبي (Trial)' },
  { value: 'suspended', label: '🔴 موقوف (Suspended)' },
  { value: 'cancelled', label: '⚪ ملغي (Cancelled)' },
]

const CYCLES = [
  { value: 'monthly', label: 'شهري' },
  { value: 'quarterly', label: 'ربع سنوي' },
  { value: 'annual', label: 'سنوي' },
]

export default function AdminGymEditPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const gymId = params.id

  const [gym, setGym] = useState<AdminGym | null>(null)
  const [loading, setLoading] = useState(true)

  // Editable Form State
  const [form, setForm] = useState({
    name: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    phone: '',
    city: '',
    address: '',
    adminNotes: '',
  })

  const [basePlanPrice, setBasePlanPrice] = useState<number>(BILLING_PLANS.starter.price)
  const [addons, setAddons] = useState<string[]>([])
  const [status, setStatus] = useState('trial')
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [nextBillingDate, setNextBillingDate] = useState('')
  const [trialEndsAt, setTrialEndsAt] = useState('')

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [saved, setSaved] = useState(false)
  const [resetSuccess, setResetSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!gymId) return
    fetch(`/api/admin/gyms/${gymId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.gym) {
          const g = data.gym
          setGym(g)
          setForm({
            name: g.name || '',
            ownerName: g.ownerName || '',
            ownerEmail: g.ownerEmail || '',
            ownerPhone: g.ownerPhone || '',
            phone: g.phone || '',
            city: g.city || '',
            address: g.address || '',
            adminNotes: g.adminNotes || '',
          })
          setBasePlanPrice(g.basePlanPrice || BILLING_PLANS.starter.price)
          setAddons(g.addons || [])
          setStatus(g.status || 'trial')
          setBillingCycle(g.billingCycle || 'monthly')
          setNextBillingDate(g.nextBillingDate ? g.nextBillingDate.split('T')[0] : '')
          setTrialEndsAt(g.trialEndsAt ? g.trialEndsAt.split('T')[0] : '')
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [gymId])

  const toggleAddon = (key: string) => {
    setAddons((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
    )
  }

  const handlePlanChange = (price: number) => {
    setBasePlanPrice(price)
    const planKey = getPlanByPrice(price)
    if (planKey) {
      setAddons(getAddonsForPlan(planKey) as string[])
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch(`/api/admin/gyms/${gymId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          basePlanPrice,
          addons,
          status,
          billingCycle,
          nextBillingDate: nextBillingDate || null,
          trialEndsAt: trialEndsAt || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ')
      
      setGym((prev) =>
        prev
          ? {
              ...prev,
              ...form,
              basePlanPrice,
              addons,
              status,
              billingCycle,
              nextBillingDate,
              trialEndsAt,
            }
          : prev
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ البيانات')
    } finally {
      setSaving(false)
    }
  }

  // Quick Action: Toggle Status
  const handleToggleStatus = async (newStatus: string) => {
    setStatus(newStatus)
    try {
      const res = await fetch(`/api/admin/gyms/${gymId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setGym((prev) => (prev ? { ...prev, status: newStatus } : prev))
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Quick Action: Add Grace Days (+7 or +30 Days)
  const handleAddGraceDays = async (days: number) => {
    const baseDate = nextBillingDate ? new Date(nextBillingDate) : new Date()
    baseDate.setDate(baseDate.getDate() + days)
    const newDateStr = baseDate.toISOString().split('T')[0]

    setNextBillingDate(newDateStr)
    try {
      const res = await fetch(`/api/admin/gyms/${gymId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextBillingDate: newDateStr, status: 'active' }),
      })
      if (res.ok) {
        setStatus('active')
        setGym((prev) => (prev ? { ...prev, nextBillingDate: newDateStr, status: 'active' } : prev))
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Reset Owner Password
  const handleResetOwnerPassword = async () => {
    if (!window.confirm(`هل تريد إعادة تعيين كلمة مرور المالك (${gym?.ownerEmail}) إلى 123456؟`)) return
    setResettingPassword(true)
    setResetSuccess('')
    setError('')
    try {
      const res = await fetch(`/api/admin/gyms/${gymId}/reset-password`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل إعادة التعيين')
      setResetSuccess(data.message || 'تم إعادة تعيين كلمة المرور إلى 123456 بنجاح')
      setTimeout(() => setResetSuccess(''), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إعادة التعيين')
    } finally {
      setResettingPassword(false)
    }
  }

  // Delete Gym
  const handleDelete = async () => {
    if (!window.confirm('هل أنت متأكد من حذف الجيم بشكل نهائي؟ هذا الإجراء لا يمكن التراجع عنه وسيحذف كل بيانات الجيم والأعضاء المرتبطين به.')) return
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/gyms/${gymId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل الحذف')
      router.push('/admin/gyms')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#22C55E]" />
      </div>
    )
  }

  if (!gym) {
    return (
      <div className="text-center py-20 text-muted-c">
        <p>الجيم غير موجود</p>
      </div>
    )
  }

  const inputClass =
    'w-full bg-app border border-app rounded-xl py-3 px-4 text-strong focus:outline-none focus:border-[#22C55E]/50 focus:ring-2 focus:ring-[#22C55E]/20'

  const selectedPlanKey = getPlanByPrice(basePlanPrice)
  const proSelected = selectedPlanKey === 'pro'
  const addonsTotal = proSelected
    ? 0
    : addons.reduce((sum, key) => sum + (ADDONS[key as keyof typeof ADDONS]?.price ?? 0), 0)

  // WhatsApp reminder URL for owner
  const whatsappNumber = (gym.ownerPhone || '').replace(/[^0-9]/g, '')
  const whatsappMessage = encodeURIComponent(`أهلاً كابتن ${gym.ownerName}، تذكير باشتراك جيم ${gym.name} في منصة OpenGym. يرجى التواصل معنا للتجديد.`)
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push('/admin/gyms')}
        className="flex items-center gap-2 text-sm text-muted-c hover:text-strong transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        العودة لقائمة الجيمات
      </button>

      {/* Header & Quick Status */}
      <div className="flex items-center justify-between flex-wrap gap-4 glass-card p-6 rounded-2xl border border-[#22C55E]/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#22C55E]/10 flex items-center justify-center border border-[#22C55E]/30">
            <Building2 className="w-7 h-7 text-[#22C55E]" />
          </div>
          <div>
            <h2 className="font-cairo font-bold text-2xl text-white">{gym.name}</h2>
            <p className="text-sm text-muted-c">
              المالك: {gym.ownerName} · <span dir="ltr">{gym.ownerEmail}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {gym.status === 'active' ? (
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> نشط
            </span>
          ) : gym.status === 'trial' ? (
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <Clock className="w-4 h-4" /> تجريبي
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1">
              <ShieldAlert className="w-4 h-4" /> موقوف
            </span>
          )}

          {whatsappNumber && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold hover:bg-green-500/20 transition-colors flex items-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4" />
              واتساب المالك
            </a>
          )}
        </div>
      </div>

      {/* 🚀 Quick Actions Bar (شريط الإجراءات السريعة) */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h3 className="font-cairo font-bold text-lg text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#22C55E]" />
          إجراءات التحكم السريع (Quick Actions)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {gym.status !== 'active' ? (
            <button
              onClick={() => handleToggleStatus('active')}
              className="py-3 px-4 bg-[#22C55E] text-white rounded-xl text-xs font-bold hover:bg-[#16A34A] transition-colors flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              تفعيل الحساب 🟢
            </button>
          ) : (
            <button
              onClick={() => handleToggleStatus('suspended')}
              className="py-3 px-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              إيقاف الحساب 🔴
            </button>
          )}

          <button
            onClick={() => handleAddGraceDays(7)}
            className="py-3 px-4 bg-app border border-app text-white rounded-xl text-xs font-bold hover:surface transition-colors flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4 text-[#22C55E]" />
            إضافة سماح (+7 أيام)
          </button>

          <button
            onClick={() => handleAddGraceDays(30)}
            className="py-3 px-4 bg-app border border-app text-white rounded-xl text-xs font-bold hover:surface transition-colors flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4 text-[#22C55E]" />
            إضافة شهر (+30 يوم)
          </button>

          <button
            onClick={handleResetOwnerPassword}
            disabled={resettingPassword}
            className="py-3 px-4 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-bold hover:bg-amber-500 hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {resettingPassword ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <KeyRound className="w-4 h-4" />
            )}
            تأفير الباسورد 123456
          </button>
        </div>

        {resetSuccess && (
          <div className="p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {resetSuccess}
          </div>
        )}
      </div>

      {/* Gym Stats Snapshot */}
      {gym._count && (
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center text-[#22C55E]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{gym._count.members}</div>
              <div className="text-xs text-muted-c">الأعضاء المسجلين</div>
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{gym._count.subscriptions}</div>
              <div className="text-xs text-muted-c">الاشتراكات النشطة</div>
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{gym._count.branches}</div>
              <div className="text-xs text-muted-c">عدد الفروع</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Edit Form (كل بيانات الجيم والاشتراك) ───────────────── */}
      <form onSubmit={handleSave} className="glass-card p-6 rounded-2xl space-y-6">
        <h3 className="font-cairo font-bold text-lg text-white">تعديل كافة بيانات الجيم</h3>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        {saved && (
          <div className="p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            تم حفظ التغييرات بنجاح
          </div>
        )}

        {/* Gym & Owner Basic Info */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-[#22C55E] border-b border-app pb-2">1. بيانات الجيم والمالك الأساسية</h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-soft">اسم الجيم</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-soft">اسم صاحب الجيم</label>
              <input
                type="text"
                required
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-soft">تليفون المالك (واتساب)</label>
              <input
                type="tel"
                required
                dir="ltr"
                value={form.ownerPhone}
                onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
                className={`${inputClass} text-left`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-soft">البريد الإلكتروني للمالك</label>
              <input
                type="email"
                required
                dir="ltr"
                value={form.ownerEmail}
                onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                className={`${inputClass} text-left`}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-soft">تليفون الجيم</label>
              <input
                type="tel"
                dir="ltr"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={`${inputClass} text-left`}
                placeholder="01012345678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-soft">المدينة</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={inputClass}
                placeholder="القاهرة"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-soft">العنوان التفصيلي</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={inputClass}
                placeholder="اسم الشارع والمكاني"
              />
            </div>
          </div>
        </div>

        {/* Subscription & Dates Control */}
        <div className="space-y-4 pt-4 border-t border-app">
          <h4 className="text-sm font-bold text-[#22C55E] border-b border-app pb-2">2. الباقة والتواريخ وفترة السماح</h4>

          {/* Plan Picker */}
          <div>
            <label className="block text-sm font-medium mb-3 text-soft">الباقة الحالية</label>
            <div className="grid grid-cols-2 gap-3">
              {PLANS.map((plan) => {
                const active = basePlanPrice === plan.price
                const isPro = plan.key === 'pro'
                return (
                  <button
                    type="button"
                    key={plan.key}
                    onClick={() => handlePlanChange(plan.price)}
                    className={`p-4 rounded-xl border-2 text-right transition-all ${
                      active
                        ? 'border-[#22C55E] bg-[#22C55E]/5'
                        : 'border-app hover:border-[#22C55E]/30'
                    }`}
                  >
                    <div className="font-cairo font-bold mb-1">{plan.name}</div>
                    <div className="text-xl font-bold text-[#22C55E]">
                      {plan.price.toLocaleString('ar-EG')}
                      <span className="text-xs text-faint font-normal"> ج/شهر</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-soft">حالة الحساب</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputClass}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-soft">دورة الفاتورة</label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
                className={inputClass}
              >
                {CYCLES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-soft">تاريخ نهاية الاشتراك / الفاتورة</label>
              <input
                type="date"
                dir="ltr"
                value={nextBillingDate}
                onChange={(e) => setNextBillingDate(e.target.value)}
                className={`${inputClass} text-left`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-soft">نهاية التجربة / السماح</label>
              <input
                type="date"
                dir="ltr"
                value={trialEndsAt}
                onChange={(e) => setTrialEndsAt(e.target.value)}
                className={`${inputClass} text-left`}
              />
            </div>
          </div>
        </div>

        {/* Addons Selection */}
        <div className="space-y-4 pt-4 border-t border-app">
          <h4 className="text-sm font-bold text-[#22C55E] border-b border-app pb-2">3. الإضافات والمميزات المفتوحة</h4>
          
          <div className={`grid md:grid-cols-2 gap-3 ${proSelected ? 'opacity-60 pointer-events-none' : ''}`}>
            {Object.values(ADDONS).map((addon) => {
              const active = addons.includes(addon.key)
              return (
                <label
                  key={addon.key}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    active
                      ? 'border-[#22C55E]/40 bg-[#22C55E]/5'
                      : 'border-app hover:border-[#22C55E]/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleAddon(addon.key)}
                    className="w-5 h-5 rounded accent-[#22C55E]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{addon.name}</div>
                    <div className="text-xs text-muted-c">{addon.description}</div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        {/* Admin Secret Notes */}
        <div className="space-y-2 pt-4 border-t border-app">
          <h4 className="text-sm font-bold text-[#22C55E] border-b border-app pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            4. ملاحظات الأدمن السرية (خاص بالسوبر أدمن فقط)
          </h4>
          <textarea
            rows={3}
            value={form.adminNotes}
            onChange={(e) => setForm({ ...form, adminNotes: e.target.value })}
            className={inputClass}
            placeholder="اكتب أي ملاحظات خاصة بالجيم هنا (مثال: تم تحويل 300ج انستاباي يتبقى 200ج يوم 15 في الشهر)..."
          />
        </div>

        {/* Total Pricing Summary */}
        <div className="p-4 surface rounded-xl border border-app space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-c">الباقة الأسسية ({selectedPlanKey === 'pro' ? 'Pro' : 'Starter'})</span>
            <span>{formatCurrency(basePlanPrice)}</span>
          </div>
          {!proSelected && addonsTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-c">الإضافات ({addons.length})</span>
              <span>{formatCurrency(addonsTotal)}</span>
            </div>
          )}
          <div className="pt-2 border-t border-app flex justify-between font-bold text-base">
            <span>إجمالي الاشتراك الشهري</span>
            <span className="text-[#22C55E]">
              {formatCurrency(basePlanPrice + addonsTotal)}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-[#22C55E] text-white rounded-xl font-cairo font-bold hover:bg-[#16A34A] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-base shadow-lg shadow-[#22C55E]/20"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري حفظ البيانات...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              حفظ وتأكيد البيانات بالكامل
            </>
          )}
        </button>
      </form>

      {/* Delete Gym Zone */}
      <div className="glass-card p-6 rounded-2xl border-red-500/20 bg-red-500/5 mt-6">
        <h3 className="font-cairo font-bold text-lg text-red-500 mb-2">منطقة الخطر (حذف الجيم)</h3>
        <p className="text-sm text-muted-c mb-4">
          حذف الجيم سيؤدي إلى مسح كل البيانات المرتبطة به نهائياً (الاشتراكات، الأعضاء، الفروع...).
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="w-full py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-semibold hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {deleting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري الحذف...
            </>
          ) : (
            <>
              <Trash2 className="w-5 h-5" />
              حذف الجيم نهائياً من السيستم
            </>
          )}
        </button>
      </div>
    </div>
  )
}
