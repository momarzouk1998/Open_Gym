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
  lastPaidAt: string | null
  createdAt: string
}

// Pulled from billing.ts — single source of truth
const PLANS = [
  { key: BILLING_PLANS.starter.key, name: BILLING_PLANS.starter.name, price: BILLING_PLANS.starter.price },
  { key: BILLING_PLANS.pro.key,     name: BILLING_PLANS.pro.name,     price: BILLING_PLANS.pro.price     },
] as const

const STATUSES = [
  { value: 'active', label: 'فعّال' },
  { value: 'trial', label: 'تجريبي' },
  { value: 'suspended', label: 'موقوف' },
  { value: 'cancelled', label: 'ملغي' },
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

  // Editable fields
  const [basePlanPrice, setBasePlanPrice] = useState<number>(BILLING_PLANS.starter.price)
  const [addons, setAddons] = useState<string[]>([])
  const [status, setStatus] = useState('trial')
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [nextBillingDate, setNextBillingDate] = useState('')

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!gymId) return
    fetch(`/api/admin/gyms/${gymId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.gym) {
          setGym(data.gym)
          setBasePlanPrice(data.gym.basePlanPrice || BILLING_PLANS.starter.price)
          setAddons(data.gym.addons || [])
          setStatus(data.gym.status || 'trial')
          setBillingCycle(data.gym.billingCycle || 'monthly')
          setNextBillingDate(
            data.gym.nextBillingDate
              ? data.gym.nextBillingDate.split('T')[0]
              : ''
          )
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

  // When admin selects a plan, auto-assign addons accordingly:
  // Pro → all addons included. Starter → clear addons (admin can re-add manually).
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
          basePlanPrice,
          addons,
          status,
          billingCycle,
          nextBillingDate: nextBillingDate || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ')
      setGym((prev) =>
        prev
          ? { ...prev, basePlanPrice, addons, status, billingCycle, nextBillingDate }
          : prev
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

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

  // Pro includes all addons — no extra charge. Starter charges per addon.
  const addonsTotal = proSelected
    ? 0
    : addons.reduce((sum, key) => sum + (ADDONS[key as keyof typeof ADDONS]?.price ?? 0), 0)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push('/admin/gyms')}
        className="flex items-center gap-2 text-sm text-muted-c hover:text-strong transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        العودة للجيمات
      </button>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-[#22C55E]" />
        </div>
        <div>
          <h2 className="font-cairo font-bold text-2xl">{gym.name}</h2>
          <p className="text-sm text-muted-c">
            {gym.ownerName} ·{' '}
            <span dir="ltr">{gym.ownerEmail}</span>
          </p>
        </div>
      </div>

      {/* Info grid (read-only) */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="font-cairo font-bold text-lg mb-4">معلومات الجيم</h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-c block mb-1">تليفون المالك</span>
            <span dir="ltr">{gym.ownerPhone || '—'}</span>
          </div>
          <div>
            <span className="text-muted-c block mb-1">تليفون الجيم</span>
            <span dir="ltr">{gym.phone || '—'}</span>
          </div>
          <div>
            <span className="text-muted-c block mb-1">المدينة</span>
            <span>{gym.city || '—'}</span>
          </div>
          <div>
            <span className="text-muted-c block mb-1">العنوان</span>
            <span>{gym.address || '—'}</span>
          </div>
          <div>
            <span className="text-muted-c block mb-1">تاريخ التسجيل</span>
            <span>{formatDate(gym.createdAt)}</span>
          </div>
          {gym.lastPaidAt && (
            <div>
              <span className="text-muted-c block mb-1">آخر دفع</span>
              <span>{formatDate(gym.lastPaidAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Editable form */}
      <form onSubmit={handleSave} className="glass-card p-6 rounded-2xl space-y-5">
        <h3 className="font-cairo font-bold text-lg">التحكم في الاشتراك</h3>

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

        {/* Plan picker */}
        <div>
          <label className="block text-sm font-medium mb-3 text-soft">
            الباقة
          </label>
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
                  {isPro && (
                    <div className="mt-2 text-[10px] text-[#4ADE80] bg-[#22C55E]/10 rounded-lg px-2 py-1 text-center">
                      يشمل كل الإضافات
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Status + cycle + next billing */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-soft">
              الحالة
            </label>
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
            <label className="block text-sm font-medium mb-2 text-soft">
              دورة الفاتورة
            </label>
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
            <label className="block text-sm font-medium mb-2 text-soft">
              تاريخ الفاتورة القادمة
            </label>
            <input
              type="date"
              dir="ltr"
              value={nextBillingDate}
              onChange={(e) => setNextBillingDate(e.target.value)}
              className={`${inputClass} text-left`}
            />
          </div>
        </div>

        {/* Addons */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-soft">
              الإضافات
            </label>
            {proSelected && (
              <span className="text-xs px-2 py-1 rounded-full bg-[#22C55E]/10 text-[#4ADE80] font-medium">
                مدمجة في Pro — لا رسوم إضافية
              </span>
            )}
          </div>
          <div className={`space-y-2 ${proSelected ? 'opacity-60 pointer-events-none' : ''}`}>
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
                  <span className={`text-sm font-bold whitespace-nowrap ${proSelected ? 'text-[#22C55E]' : 'text-[#22C55E]'}`}>
                    {proSelected ? 'مدمج' : `+${addon.price} ج`}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Price summary */}
        <div className="p-4 surface rounded-xl border border-app space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-c">الباقة ({selectedPlanKey === 'pro' ? 'Pro' : 'Starter'})</span>
            <span>{formatCurrency(basePlanPrice)}</span>
          </div>
          {!proSelected && addonsTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-c">الإضافات ({addons.length})</span>
              <span>{formatCurrency(addonsTotal)}</span>
            </div>
          )}
          {proSelected && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-c">الإضافات</span>
              <span className="text-[#22C55E]">مدمجة — 0 ج</span>
            </div>
          )}
          <div className="pt-2 border-t border-app flex justify-between font-bold">
            <span>الإجمالي شهرياً</span>
            <span className="text-[#22C55E]">
              {formatCurrency(basePlanPrice + addonsTotal)}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-[#22C55E] text-white rounded-xl font-semibold hover:bg-[#16A34A] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              حفظ التغييرات
            </>
          )}
        </button>
      </form>

      {/* Delete Gym Zone */}
      <div className="glass-card p-6 rounded-2xl border-red-500/20 bg-red-500/5 mt-6">
        <h3 className="font-cairo font-bold text-lg text-red-500 mb-2">منطقة الخطر</h3>
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
              حذف الجيم نهائياً
            </>
          )}
        </button>
      </div>
    </div>
  )
}
