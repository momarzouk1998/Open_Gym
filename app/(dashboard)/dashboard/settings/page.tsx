'use client'

import { useState, useEffect } from 'react'
import { useGymStore } from '@/store/gym-store'
import { formatCurrency } from '@/lib/utils'
import { ADDONS } from '@/lib/addons'
import {
  Building2,
  CreditCard,
  Loader2,
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react'

interface GymDetails {
  id: string
  name: string
  slug: string
  phone: string | null
  city: string | null
  address: string | null
  status: string
  basePlanPrice: number
  billingCycle: string
  addons: string[]
  createdAt: string
}

interface GymPlan {
  id: string
  name: string
  duration: number
  price: number
}

const PLANS = [
  { key: 'starter', name: 'Starter', price: 299, desc: 'للجيمات الصغيرة' },
  { key: 'pro', name: 'Pro', price: 599, desc: 'كل المميزات' },
] as const

export default function SettingsPage() {
  const { gym } = useGymStore()
  const gymSlug = gym?.slug

  const [gymData, setGymData] = useState<GymDetails | null>(null)
  const [plans, setPlans] = useState<GymPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    phone: '',
    city: '',
    address: '',
  })

  // Plan form
  const [planForm, setPlanForm] = useState({ name: '', duration: '30', price: '300' })
  const [planSaving, setPlanSaving] = useState(false)

  useEffect(() => {
    if (!gymSlug) return
    fetch(`/api/gyms/${gymSlug}`)
      .then((res) => res.json())
      .then((data) => {
        setGymData(data.gym)
        setPlans(data.plans)
        setForm({
          name: data.gym.name || '',
          phone: data.gym.phone || '',
          city: data.gym.city || '',
          address: data.gym.address || '',
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [gymSlug])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gymSlug) return
    setSaving(true)
    setError('')
    setSaved(false)

    try {
      const res = await fetch(`/api/gyms/${gymSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gymSlug) return
    setPlanSaving(true)
    try {
      const res = await fetch(`/api/gyms/${gymSlug}/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planForm.name,
          duration: parseInt(planForm.duration),
          price: parseFloat(planForm.price),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل إضافة الخطة')
      setPlans([...plans, data.plan])
      setPlanForm({ name: '', duration: '30', price: '300' })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setPlanSaving(false)
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (!gymSlug) return
    if (!confirm('متأكد من حذف هذه الخطة؟')) return
    try {
      const res = await fetch(`/api/gyms/${gymSlug}/plans/${planId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('فشل الحذف')
      setPlans(plans.filter((p) => p.id !== planId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ')
    }
  }

  // --- Plan + Addons section state ---
  const [selectedPrice, setSelectedPrice] = useState<number>(299)
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [addonsSaving, setAddonsSaving] = useState(false)
  const [planError, setPlanError] = useState('')
  const [planSaved, setPlanSaved] = useState(false)

  // Sync local plan/addons state once gym data loads
  useEffect(() => {
    if (gymData) {
      setSelectedPrice(gymData.basePlanPrice || 299)
      setSelectedAddons(gymData.addons || [])
    }
  }, [gymData])

  const toggleAddon = (key: string) => {
    setSelectedAddons((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
    )
  }

  const handlePlanAddonsSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gymSlug) return
    setAddonsSaving(true)
    setPlanError('')
    setPlanSaved(false)
    try {
      const res = await fetch(`/api/gyms/${gymSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basePlanPrice: selectedPrice,
          addons: selectedAddons,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ')
      setGymData((prev) =>
        prev ? { ...prev, basePlanPrice: selectedPrice, addons: selectedAddons } : prev
      )
      setPlanSaved(true)
      setTimeout(() => setPlanSaved(false), 3000)
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setAddonsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#22C55E]" />
      </div>
    )
  }

  const inputClass =
    'w-full bg-app border border-app rounded-xl py-3 px-4 text-strong focus:outline-none focus:border-[#22C55E]/50 focus:ring-2 focus:ring-[#22C55E]/20'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="font-cairo font-bold text-2xl">الإعدادات</h2>
        <p className="text-sm text-muted-c">إدارة بيانات جيمك وحسابك</p>
      </div>

      {/* Gym Info */}
      <form onSubmit={handleSave} className="glass-card p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#22C55E]" />
          </div>
          <h3 className="font-cairo font-bold text-lg">بيانات الجيم</h3>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        {saved && (
          <div className="p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            تم الحفظ بنجاح
          </div>
        )}

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
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-soft">التليفون</label>
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
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-soft">العنوان</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className={inputClass}
            placeholder="العنوان التفصيلي"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-[#22C55E] text-white rounded-xl font-semibold hover:bg-[#16A34A] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            'حفظ التغييرات'
          )}
        </button>
      </form>

      {/* Subscription Plans */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-[#22C55E]" />
          </div>
          <h3 className="font-cairo font-bold text-lg">خطط الاشتراك</h3>
        </div>

        {/* Existing plans */}
        <div className="space-y-2">
          {plans.length === 0 ? (
            <p className="text-sm text-faint">مفيش خطط بعد</p>
          ) : (
            plans.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center justify-between p-3 surface rounded-xl"
              >
                <div>
                  <div className="font-medium text-sm">{plan.name}</div>
                  <div className="text-xs text-faint">
                    {plan.duration} يوم — {formatCurrency(plan.price)}
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="p-1.5 text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add plan form */}
        <form onSubmit={handleAddPlan} className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-app">
          <input
            type="text"
            required
            placeholder="اسم الخطة"
            value={planForm.name}
            onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
            className={`${inputClass} py-2.5 text-sm`}
          />
          <input
            type="number"
            required
            min="1"
            dir="ltr"
            placeholder="المدة (يوم)"
            value={planForm.duration}
            onChange={(e) => setPlanForm({ ...planForm, duration: e.target.value })}
            className={`${inputClass} py-2.5 text-sm text-left`}
          />
          <input
            type="number"
            required
            min="0"
            dir="ltr"
            placeholder="السعر"
            value={planForm.price}
            onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
            className={`${inputClass} py-2.5 text-sm text-left`}
          />
          <button
            type="submit"
            disabled={planSaving}
            className="bg-[#22C55E]/10 text-[#22C55E] rounded-xl py-2.5 text-sm font-semibold hover:bg-[#22C55E]/20 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
          >
            {planSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            إضافة
          </button>
        </form>
      </div>

      {/* Plan + Addons (interactive) */}
      <form
        onSubmit={handlePlanAddonsSave}
        className="glass-card p-6 rounded-2xl space-y-5"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#22C55E]" />
          </div>
          <div>
            <h3 className="font-cairo font-bold text-lg">الباقة والإضافات</h3>
            <p className="text-xs text-faint">
              {gymData?.status === 'trial'
                ? 'جرّب كل الإضافات مجاناً خلال التجربة'
                : 'لتغيير الباقة أو الإضافات تواصل معنا مباشرة'}
            </p>
          </div>
        </div>

        {/* Non-trial locked notice */}
        {gymData && gymData.status !== 'trial' && (
          <div className="p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-sm text-[#F59E0B] flex items-start gap-3">
            <span className="text-lg leading-none mt-0.5">🔒</span>
            <div>
              <p className="font-semibold mb-1">التغيير يتم بالتنسيق معنا</p>
              <p className="text-xs text-[#F59E0B]/80">
                بعد انتهاء فترة التجربة، أي تغيير في الباقة أو الإضافات يتم عن طريق التواصل المباشر
                على{' '}
                <span className="font-bold" dir="ltr">01558282760</span>
                {' '}(انستاباي / فودافون كاش)
              </p>
            </div>
          </div>
        )}

        {planError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {planError}
          </div>
        )}
        {planSaved && (
          <div className="p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            تم تحديث الباقة والإضافات بنجاح
          </div>
        )}

        {/* Plan picker */}
        <div className={`grid grid-cols-2 gap-3 ${gymData?.status !== 'trial' ? 'opacity-50 pointer-events-none' : ''}`}>
          {PLANS.map((plan) => {
            const active = selectedPrice === plan.price
            return (
              <button
                type="button"
                key={plan.key}
                onClick={() => setSelectedPrice(plan.price)}
                className={`p-4 rounded-xl border-2 text-right transition-all ${
                  active
                    ? 'border-[#22C55E] bg-[#22C55E]/5'
                    : 'border-app hover:border-[#22C55E]/30'
                }`}
              >
                <div className="font-cairo font-bold text-lg mb-0.5">{plan.name}</div>
                <div className="text-xs text-muted-c mb-2">{plan.desc}</div>
                <div className="text-2xl font-bold text-[#22C55E]">
                  {plan.price}
                  <span className="text-xs text-faint font-normal"> ج/شهر</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Addons */}
        <div className={gymData?.status !== 'trial' ? 'opacity-50 pointer-events-none' : ''}>
          <p className="text-sm font-medium mb-3 text-soft">الإضافات</p>
          <div className="space-y-2">
            {Object.values(ADDONS).map((addon) => {
              const active = selectedAddons.includes(addon.key)
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
                  <span className="text-sm font-bold text-[#22C55E] whitespace-nowrap">
                    +{addon.price} ج
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Price summary */}
        {(() => {
          const addonsTotal = selectedAddons.reduce(
            (sum, key) => sum + (ADDONS[key as keyof typeof ADDONS]?.price ?? 0),
            0
          )
          const total = selectedPrice + addonsTotal
          return (
            <div className="p-4 surface rounded-xl border border-app space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-c">الباقة</span>
                <span>
                  {PLANS.find((p) => p.price === selectedPrice)?.name} —{' '}
                  {formatCurrency(selectedPrice)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-c">الإضافات ({selectedAddons.length})</span>
                <span>{formatCurrency(addonsTotal)}</span>
              </div>
              <div className="pt-2 border-t border-app flex justify-between font-bold">
                <span>الإجمالي شهرياً</span>
                <span className="text-[#22C55E]">{formatCurrency(total)}</span>
              </div>
            </div>
          )
        })()}

        {/* Payment note */}
        <div className="p-3 surface/50 rounded-xl border border-app">
          <p className="text-xs text-muted-c">
            للحصول على الإضافات أو تغيير الباقة، تواصل معنا على:{' '}
            <span className="font-bold text-[#22C55E]" dir="ltr">
              01558282760
            </span>{' '}
            (انستاباي / فودافون كاش)
          </p>
        </div>

        <button
          type="submit"
          disabled={addonsSaving || gymData?.status !== 'trial'}
          className="w-full py-3.5 bg-[#22C55E] text-white rounded-xl font-semibold hover:bg-[#16A34A] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {addonsSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري الحفظ...
            </>
          ) : gymData?.status !== 'trial' ? (
            'التواصل مطلوب لتغيير الباقة'
          ) : (
            'حفظ الباقة والإضافات'
          )}
        </button>
      </form>
    </div>
  )
}
