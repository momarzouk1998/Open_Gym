'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGymStore } from '@/store/gym-store'
import { formatCurrency } from '@/lib/utils'
import {
  Check,
  ArrowLeft,
  Dumbbell,
  CreditCard,
  Users,
  Loader2,
  Sparkles,
  ChevronLeft,
} from 'lucide-react'
import { Logo } from '@/components/Logo'

interface GymPlan {
  id: string
  name: string
  duration: number
  price: number
}

const steps = [
  { id: 1, label: 'مرحباً', icon: Sparkles },
  { id: 2, label: 'خطة اشتراك', icon: CreditCard },
  { id: 3, label: 'أول عضو', icon: Users },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { gym } = useGymStore()
  const gymSlug = gym?.slug
  const gymName = gym?.name || 'جيمك'

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Step 2: plan form
  const [planForm, setPlanForm] = useState({ name: 'شهري', duration: '30', price: '300' })
  const [planDone, setPlanDone] = useState(false)
  const [createdPlan, setCreatedPlan] = useState<GymPlan | null>(null)

  // Step 3: member form
  const [memberForm, setMemberForm] = useState({
    fullName: '',
    phone: '',
    planId: '',
    startDate: new Date().toISOString().split('T')[0],
    method: 'cash',
    skipSub: false,
  })

  // Load existing plans when reaching step 3
  const [plans, setPlans] = useState<GymPlan[]>([])
  useEffect(() => {
    if (step === 3 && gymSlug) {
      fetch(`/api/gyms/${gymSlug}/plans`)
        .then((r) => r.json())
        .then((d) => setPlans(Array.isArray(d) ? d : []))
        .catch(() => {})
    }
  }, [step, gymSlug])

  // Auto-select newly created plan
  useEffect(() => {
    if (createdPlan) {
      setMemberForm((prev) => ({ ...prev, planId: createdPlan.id }))
    }
  }, [createdPlan])

  const handleAddPlan = async () => {
    if (!gymSlug) return
    setError('')
    setSaving(true)
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
      setCreatedPlan(data.plan)
      setPlanDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  const handleAddMember = async () => {
    if (!gymSlug) return
    if (!memberForm.fullName.trim()) {
      setError('اسم العضو مطلوب')
      return
    }
    setError('')
    setSaving(true)
    try {
      const memberRes = await fetch(`/api/gyms/${gymSlug}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: memberForm.fullName, phone: memberForm.phone || undefined }),
      })
      const memberData = await memberRes.json()
      if (!memberRes.ok) throw new Error(memberData.error || 'فشل إضافة العضو')

      if (!memberForm.skipSub && memberForm.planId) {
        await fetch(`/api/gyms/${gymSlug}/subscriptions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: memberData.member.id,
            planId: memberForm.planId,
            startDate: memberForm.startDate,
            method: memberForm.method,
          }),
        })
      }

      router.push('/dashboard')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full bg-app border border-app rounded-xl py-3 px-4 text-strong focus:outline-none focus:border-[#22C55E]/50 focus:ring-2 focus:ring-[#22C55E]/20'

  return (
    <div className="min-h-screen bg-app grid-bg flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-8">
        <Logo variant="full" width={160} height={50} priority />
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step > s.id
                  ? 'bg-[#22C55E] text-white'
                  : step === s.id
                  ? 'bg-[#22C55E]/20 border-2 border-[#22C55E] text-[#22C55E]'
                  : 'bg-app border border-app text-faint'
              }`}
            >
              {step > s.id ? <Check className="w-4 h-4" /> : s.id}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-10 h-px ${step > s.id ? 'bg-[#22C55E]' : 'bg-app'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="w-full max-w-lg glass-card rounded-2xl p-8">
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* ─── Step 1: Welcome ─── */}
        {step === 1 && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#22C55E]/10 flex items-center justify-center mx-auto mb-5">
              <Dumbbell className="w-8 h-8 text-[#22C55E]" />
            </div>
            <h2 className="font-cairo font-bold text-2xl mb-2">
              أهلاً بك في {gymName} 🎉
            </h2>
            <p className="text-muted-c mb-2">
              تجربتك المجانية لمدة <span className="text-[#22C55E] font-semibold">14 يوم</span> بدأت.
            </p>
            <p className="text-sm text-faint mb-8">
              خليني أساعدك تعمل الإعداد الأولي في دقيقتين — إضافة خطة اشتراك وأول عضو.
            </p>
            <div className="space-y-3 text-right mb-8">
              {[
                'إضافة خطة اشتراك للجيم',
                'إضافة أول عضو واشتراكه',
                'البدء في استخدام لوحة التحكم',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#22C55E]/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                  </div>
                  <span className="text-sm text-soft">{item}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#22C55E] text-white rounded-xl font-bold text-base hover:bg-[#16A34A] transition-all hover:shadow-lg hover:shadow-[#22C55E]/20"
            >
              هنبدأ
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-3 w-full py-2.5 text-sm text-faint hover:text-muted-c transition-colors"
            >
              تخطّي — أبدأ بنفسي
            </button>
          </div>
        )}

        {/* ─── Step 2: Add Plan ─── */}
        {step === 2 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#22C55E]" />
              </div>
              <div>
                <h2 className="font-cairo font-bold text-xl">خطة الاشتراك</h2>
                <p className="text-sm text-muted-c">حدد سعر ومدة اشتراك أعضاءك</p>
              </div>
            </div>

            {planDone ? (
              <div className="p-4 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center gap-3 mb-6">
                <Check className="w-5 h-5 text-[#22C55E]" />
                <div>
                  <p className="font-medium text-sm text-[#22C55E]">تم إضافة الخطة</p>
                  <p className="text-xs text-faint">
                    {createdPlan?.name} — {createdPlan && formatCurrency(createdPlan.price)} / {createdPlan?.duration} يوم
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-soft">اسم الخطة</label>
                  <input
                    type="text"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    className={inputClass}
                    placeholder="شهري"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-soft">المدة (يوم)</label>
                    <input
                      type="number"
                      min="1"
                      dir="ltr"
                      value={planForm.duration}
                      onChange={(e) => setPlanForm({ ...planForm, duration: e.target.value })}
                      className={`${inputClass} text-left`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-soft">السعر (ج)</label>
                    <input
                      type="number"
                      min="0"
                      dir="ltr"
                      value={planForm.price}
                      onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                      className={`${inputClass} text-left`}
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddPlan}
                  disabled={saving}
                  className="w-full py-3 bg-[#22C55E]/10 text-[#22C55E] rounded-xl font-semibold hover:bg-[#22C55E]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  إضافة الخطة
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setPlanDone(false); setStep(3) }}
                className="text-sm text-faint hover:text-muted-c transition-colors flex items-center gap-1"
              >
                تخطّي
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!planDone}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#22C55E] text-white rounded-xl font-bold hover:bg-[#16A34A] transition-all disabled:opacity-40"
              >
                التالي
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 3: Add Member ─── */}
        {step === 3 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#22C55E]" />
              </div>
              <div>
                <h2 className="font-cairo font-bold text-xl">أول عضو</h2>
                <p className="text-sm text-muted-c">أضف أول عضو في جيمك</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-soft">اسم العضو *</label>
                <input
                  type="text"
                  value={memberForm.fullName}
                  onChange={(e) => setMemberForm({ ...memberForm, fullName: e.target.value })}
                  className={inputClass}
                  placeholder="أحمد محمد"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-soft">رقم التليفون</label>
                <input
                  type="tel"
                  dir="ltr"
                  value={memberForm.phone}
                  onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                  className={`${inputClass} text-left`}
                  placeholder="01012345678"
                />
              </div>

              {!memberForm.skipSub && plans.length > 0 && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-soft">خطة الاشتراك</label>
                    <select
                      value={memberForm.planId}
                      onChange={(e) => setMemberForm({ ...memberForm, planId: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">بدون اشتراك</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {formatCurrency(p.price)} ({p.duration} يوم)
                        </option>
                      ))}
                    </select>
                  </div>
                  {memberForm.planId && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-soft">طريقة الدفع</label>
                      <select
                        value={memberForm.method}
                        onChange={(e) => setMemberForm({ ...memberForm, method: e.target.value })}
                        className={inputClass}
                      >
                        <option value="cash">كاش</option>
                        <option value="instapay">انستاباي</option>
                        <option value="vodafone_cash">فودافون كاش</option>
                        <option value="bank_transfer">تحويل بنكي</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-c">
                <input
                  type="checkbox"
                  checked={memberForm.skipSub}
                  onChange={(e) => setMemberForm({ ...memberForm, skipSub: e.target.checked })}
                  className="w-4 h-4 accent-[#22C55E]"
                />
                إضافة عضو بدون اشتراك الآن
              </label>
            </div>

            <button
              onClick={handleAddMember}
              disabled={saving || !memberForm.fullName.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#22C55E] text-white rounded-xl font-bold hover:bg-[#16A34A] transition-all disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  إنهاء الإعداد
                </>
              )}
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-3 w-full py-2.5 text-sm text-faint hover:text-muted-c transition-colors"
            >
              تخطّي — الذهاب للوحة التحكم
            </button>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-faint">
        خطوة {step} من {steps.length}
      </p>
    </div>
  )
}
