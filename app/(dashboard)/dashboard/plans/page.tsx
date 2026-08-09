'use client'

import { useState, useEffect } from 'react'
import { useGymStore } from '@/store/gym-store'
import { PLANS } from '@/lib/billing'
import { ADDONS } from '@/lib/addons'
import {
  Crown,
  Check,
  Loader2,
  Sparkles,
  CreditCard,
  Wallet,
  UserCog,
  Dumbbell,
  Calendar,
  Building2,
  BarChart3,
  CheckCircle2,
} from 'lucide-react'

const ADDON_ICONS: Record<string, any> = {
  expenses: Wallet,
  staff: UserCog,
  trainers: Dumbbell,
  classes: Calendar,
  branches: Building2,
  advanced_reports: BarChart3,
}

export default function PlansPage() {
  const { gym } = useGymStore()
  const gymSlug = gym?.slug

  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro'>('starter')
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const isTrial = gym?.status === 'trial'

  // Sync from gym data on load
  useEffect(() => {
    if (!gym) return
    const planKey = (gym.basePlanPrice ?? 299) >= 599 ? 'pro' : 'starter'
    setSelectedPlan(planKey)
    setSelectedAddons(gym.addons || [])
    setLoading(false)
  }, [gym])

  const toggleAddon = (key: string) => {
    setSelectedAddons((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
    )
  }

  const handleSave = async () => {
    if (!gymSlug) return
    setSaving(true)
    setError('')
    setSaved(false)

    try {
      const plan = PLANS[selectedPlan]
      const res = await fetch(`/api/gyms/${gymSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basePlanPrice: plan.price,
          addons: selectedAddons,
        }),
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

  const addonsTotal = selectedAddons.reduce(
    (sum, key) => sum + (ADDONS[key as keyof typeof ADDONS]?.price ?? 0),
    0
  )
  const planPrice = PLANS[selectedPlan].price
  const totalPrice = planPrice + addonsTotal

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#22C55E]" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-cairo font-bold text-2xl">الباقات والأسعار</h2>
        <p className="text-sm text-muted-c mt-1">
          اختار الباقة والإضافات المناسبة لجيمك
        </p>
      </div>

      {/* Trial banner */}
      {isTrial && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20">
          <div className="w-9 h-9 rounded-lg bg-[#22C55E]/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-[#22C55E]" />
          </div>
          <div>
            <p className="text-sm font-medium text-strong">
              أنت في التجربة المجانية — كل المميزات مفتوحة دلوقتي
            </p>
            <p className="text-xs text-faint">
              جرّب كل حاجة واختار الباقة المناسبة لك قبل ما التجربة تنتهي
            </p>
          </div>
        </div>
      )}

      {/* Plans comparison */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-5 h-5 text-[#22C55E]" />
          <h3 className="font-cairo font-bold text-lg">الباقات</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {Object.values(PLANS).map((plan) => {
            const isSelected = selectedPlan === plan.key
            const isPopular = 'popular' in plan && plan.popular
            return (
              <button
                key={plan.key}
                onClick={() => setSelectedPlan(plan.key as 'starter' | 'pro')}
                className={`relative p-6 rounded-2xl border-2 text-right transition-all ${
                  isSelected
                    ? 'border-[#22C55E] bg-[#22C55E]/5'
                    : 'border-app hover:border-[#22C55E]/30'
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-4 px-2.5 py-0.5 bg-[#22C55E] text-white text-xs font-bold rounded-full">
                    الأكثر شعبية
                  </span>
                )}
                <div className="flex items-center justify-between mb-3">
                  <div className="font-cairo font-bold text-xl">{plan.name}</div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="text-3xl font-bold text-[#22C55E] mb-4">
                  {plan.price}
                  <span className="text-sm text-faint font-normal"> ج/شهر</span>
                </div>
                <ul className="space-y-2">
                  {plan.includes.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-soft">
                      <Check className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>
      </div>

      {/* Addons */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-[#22C55E]" />
          <h3 className="font-cairo font-bold text-lg">الإضافات</h3>
        </div>

        <p className="text-sm text-muted-c mb-4">
          اختار الإضافات اللي محتاجها زيادة عن الباقة الأساسية
        </p>

        <div className="grid md:grid-cols-2 gap-3">
          {Object.values(ADDONS).map((addon) => {
            const isActive = selectedAddons.includes(addon.key)
            const IconComponent = ADDON_ICONS[addon.key] || CreditCard
            return (
              <button
                key={addon.key}
                onClick={() => toggleAddon(addon.key)}
                className={`flex items-start gap-3 p-4 rounded-xl border text-right transition-all ${
                  isActive
                    ? 'border-[#22C55E]/40 bg-[#22C55E]/5'
                    : 'border-app hover:border-[#22C55E]/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isActive
                      ? 'bg-[#22C55E] border-[#22C55E]'
                      : 'border-app'
                  }`}
                >
                  {isActive && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <IconComponent className="w-4 h-4 text-[#22C55E]" />
                    <span className="font-medium text-sm">{addon.name}</span>
                  </div>
                  <p className="text-xs text-muted-c mb-2">{addon.description}</p>
                  <span className="text-sm font-bold text-[#22C55E]">
                    +{addon.price} ج/شهر
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Price summary */}
      <div className="glass-card p-6 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-5 h-5 text-[#22C55E]" />
          <h3 className="font-cairo font-bold text-lg">ملخص الاشتراك</h3>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-c">باقة {PLANS[selectedPlan].name}</span>
          <span>{planPrice} ج</span>
        </div>
        {selectedAddons.map((key) => (
          <div key={key} className="flex justify-between text-sm">
            <span className="text-muted-c">
              {ADDONS[key as keyof typeof ADDONS].name}
            </span>
            <span>{ADDONS[key as keyof typeof ADDONS].price} ج</span>
          </div>
        ))}
        {selectedAddons.length === 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-c">إضافات</span>
            <span className="text-faint">مفيش إضافات</span>
          </div>
        )}
        <div className="pt-3 border-t border-app flex justify-between font-bold text-lg">
          <span>الإجمالي شهرياً</span>
          <span className="text-[#22C55E]">{totalPrice} ج</span>
        </div>
      </div>

      {/* Save status */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      {saved && (
        <div className="p-4 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          تم حفظ اختيارك بنجاح
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 bg-[#22C55E] text-white rounded-xl font-bold text-lg hover:bg-[#16A34A] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            جاري الحفظ...
          </>
        ) : (
          'تأكيد الاشتراك'
        )}
      </button>

      {/* Payment note */}
      <div className="p-4 surface rounded-xl border border-app text-center">
        <p className="text-xs text-muted-c">
          للحصول على الباقة، تواصل معنا على:{' '}
          <span className="font-bold text-[#22C55E]" dir="ltr">
            01558282760
          </span>{' '}
          (انستاباي / فودافون كاش)
        </p>
      </div>
    </div>
  )
}
