'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGymStore } from '@/store/gym-store'
import { formatCurrency } from '@/lib/utils'
import { ArrowRight, User, CreditCard, Loader2, CheckCircle2 } from 'lucide-react'

interface GymPlan {
  id: string
  name: string
  duration: number
  price: number
}

export default function NewMemberPage() {
  const router = useRouter()
  const { gym } = useGymStore()
  const gymSlug = gym?.slug

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [plans, setPlans] = useState<GymPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    gender: '',
    notes: '',
    // subscription
    planId: '',
    startDate: new Date().toISOString().split('T')[0],
    discount: '',
    method: 'cash',
    createSubscription: true,
  })

  // Load gym plans
  useEffect(() => {
    if (!gymSlug) return
    fetch(`/api/gyms/${gymSlug}/plans`)
      .then((res) => res.json())
      .then((data) => {
        setPlans(Array.isArray(data) ? data : [])
        setPlansLoading(false)
      })
      .catch(() => setPlansLoading(false))
  }, [gymSlug])

  const selectedPlan = plans.find((p) => p.id === form.planId)
  const discount = form.discount ? parseFloat(form.discount) || 0 : 0
  const finalPrice = selectedPlan ? Math.max(0, selectedPlan.price - discount) : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gymSlug) return
    setLoading(true)
    setError('')

    // Build an optimistic member object to show immediately
    const optimisticId = `optimistic-${Date.now()}`
    const optimisticMember = {
      id: optimisticId,
      memberNumber: '...',
      fullName: form.fullName,
      phone: form.phone || null,
      gender: form.gender || null,
      isActive: true,
      createdAt: new Date().toISOString(),
      subscriptions: [],
    }

    try {
      // 1. Create the member
      const memberRes = await fetch(`/api/gyms/${gymSlug}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone || undefined,
          gender: form.gender || undefined,
          notes: form.notes || undefined,
        }),
      })

      const memberData = await memberRes.json()
      if (!memberRes.ok) {
        throw new Error(memberData.error || 'فشل إضافة العضو')
      }

      // 2. Optionally create subscription
      if (form.createSubscription && form.planId && selectedPlan) {
        const subRes = await fetch(`/api/gyms/${gymSlug}/subscriptions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: memberData.member.id,
            planId: form.planId,
            startDate: form.startDate,
            discount: discount || undefined,
            method: form.method,
          }),
        })

        const subData = await subRes.json()
        if (!subRes.ok) {
          // Member created but subscription failed — warn but don't block
          console.error('Subscription failed:', subData.error)
          setError(
            `تم إضافة العضو، لكن فشل إنشاء الاشتراك: ${subData.error}. يمكنك المحاولة مرة أخرى من صفحة الاشتراكات.`
          )
          setTimeout(() => router.push('/dashboard/members'), 2500)
          return
        }
      }

      // Navigate immediately — member exists in DB
      router.push(`/dashboard/members/${memberData.member.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full bg-app border border-app rounded-xl py-3 px-4 text-strong focus:outline-none focus:border-[#22C55E]/50 focus:ring-2 focus:ring-[#22C55E]/20'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="font-cairo font-bold text-2xl">إضافة عضو جديد</h2>
        <p className="text-sm text-muted-c">أدخل بيانات العضو واشتراكه</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
              <User className="w-5 h-5 text-[#22C55E]" />
            </div>
            <h3 className="font-cairo font-bold text-lg">البيانات الأساسية</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-soft">
                الاسم الكامل *
              </label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className={inputClass}
                placeholder="أحمد محمد"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-soft">
                رقم التليفون *
              </label>
              <input
                type="tel"
                required
                dir="ltr"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={`${inputClass} text-left`}
                placeholder="01012345678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-soft">
                الجنس
              </label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className={inputClass}
              >
                <option value="">اختر...</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#22C55E]" />
              </div>
              <h3 className="font-cairo font-bold text-lg">الاشتراك</h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.createSubscription}
                onChange={(e) =>
                  setForm({ ...form, createSubscription: e.target.checked })
                }
                className="w-4 h-4 accent-[#22C55E]"
              />
              <span className="text-sm text-muted-c">تفعيل الاشتراك دلوقتي</span>
            </label>
          </div>

          {form.createSubscription && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-soft">
                  نوع الاشتراك *
                </label>
                {plansLoading ? (
                  <div className={`${inputClass} flex items-center gap-2`}>
                    <Loader2 className="w-4 h-4 animate-spin text-faint" />
                    <span className="text-faint">جاري تحميل الخطط...</span>
                  </div>
                ) : plans.length === 0 ? (
                  <div className={`${inputClass} text-[#F59E0B]`}>
                    مفيش خطط. اتصل بالأدمن.
                  </div>
                ) : (
                  <select
                    required={form.createSubscription}
                    value={form.planId}
                    onChange={(e) => setForm({ ...form, planId: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">اختر الخطة...</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - {formatCurrency(plan.price)} ({plan.duration} يوم)
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-soft">
                  تاريخ البداية *
                </label>
                <input
                  type="date"
                  required={form.createSubscription}
                  dir="ltr"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className={`${inputClass} text-left`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-soft">
                  الخصم (جنيه)
                </label>
                <input
                  type="number"
                  min="0"
                  dir="ltr"
                  value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: e.target.value })}
                  className={`${inputClass} text-left`}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-soft">
                  طريقة الدفع *
                </label>
                <select
                  value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value })}
                  className={inputClass}
                >
                  <option value="cash">كاش</option>
                  <option value="instapay">انستاباي</option>
                  <option value="vodafone_cash">فودافون كاش</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                </select>
              </div>

              {/* Price summary */}
              {selectedPlan && (
                <div className="md:col-span-2 p-4 surface rounded-xl border border-app">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-c">المبلغ المطلوب</span>
                    <div className="text-left">
                      <span className="text-lg font-bold font-cairo text-[#22C55E]">
                        {formatCurrency(finalPrice)}
                      </span>
                      {discount > 0 && (
                        <span className="text-xs text-faint line-through mr-2">
                          {formatCurrency(selectedPlan.price)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3.5 border border-app text-strong rounded-xl font-semibold hover:surface transition-all"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3.5 bg-[#22C55E] text-white rounded-xl font-semibold hover:bg-[#16A34A] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                حفظ العضو
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
