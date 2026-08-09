'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Building2,
  User,
  Gift,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { PasswordStrength } from '@/components/ui/PasswordStrength'

type FormData = {
  // Gym
  gymName: string
  city: string
  // Owner
  ownerName: string
  ownerEmail: string
  ownerPassword: string
  ownerPhone: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<FormData>({
    gymName: '',
    city: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    ownerPhone: '',
  })

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateStep = (): boolean => {
    setError('')
    if (step === 1) {
      if (!formData.gymName.trim()) {
        setError('اسم الجيم مطلوب')
        return false
      }
    }
    if (step === 2) {
      if (!formData.ownerName.trim()) {
        setError('اسم المالك مطلوب')
        return false
      }
      if (!formData.ownerEmail.trim()) {
        setError('البريد الإلكتروني مطلوب')
        return false
      }
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.ownerEmail.trim())) {
        setError('صيغة البريد الإلكتروني غير صحيحة')
        return false
      }
      if (!formData.ownerPhone.trim()) {
        setError('رقم التليفون مطلوب')
        return false
      }
      // Validate Egyptian phone number (01x + 9 digits = 11 digits total)
      const phoneRegex = /^01[0-9]{9}$/
      if (!phoneRegex.test(formData.ownerPhone.trim())) {
        setError('رقم التليفون غير صحيح — مثال: 01012345678')
        return false
      }
      if (formData.ownerPassword.length < 6) {
        setError('كلمة المرور لازم 6 حروف على الأقل')
        return false
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateStep()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'حدث خطأ، حاول مرة أخرى')
        return
      }

      // Auto-login
      await signIn('credentials', {
        email: formData.ownerEmail,
        password: formData.ownerPassword,
        redirect: false,
      })

      router.push('/onboarding')
      router.refresh()
    } catch {
      setError('حدث خطأ في الاتصال، حاول مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (validateStep()) setStep(step + 1)
  }

  const prevStep = () => setStep(step - 1)

  return (
    <div className="min-h-screen py-12 px-4 grid-bg relative overflow-hidden">
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[#22C55E]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl mx-auto relative z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Logo variant="full" width={180} height={56} priority />
        </Link>

        {/* Stepper — 2 steps only */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-cairo transition-all ${
                  step >= s
                    ? 'bg-[#22C55E] text-white'
                    : 'surface text-faint border border-app'
                }`}
              >
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 2 && (
                <div
                  className={`w-12 h-px ${step > s ? 'bg-[#22C55E]' : 'bg-[#1F1F2E]'}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="glass-card p-8 rounded-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Step 1: Gym Info */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#22C55E]" />
                </div>
                <div>
                  <h2 className="font-cairo font-bold text-xl">بيانات الجيم</h2>
                  <p className="text-sm text-muted-c">
                    معلومات أساسية عن جيمك
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-soft">
                    اسم الجيم *
                  </label>
                  <input
                    type="text"
                    value={formData.gymName}
                    onChange={(e) => updateField('gymName', e.target.value)}
                    className="w-full bg-app border border-app rounded-xl py-3 px-4 text-strong placeholder:text-faint focus:outline-none focus:border-[#22C55E]/50 focus:ring-2 focus:ring-[#22C55E]/20"
                    placeholder="مثال: جيم القوة"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-soft">
                    المدينة
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="w-full bg-app border border-app rounded-xl py-3 px-4 text-strong placeholder:text-faint focus:outline-none focus:border-[#22C55E]/50 focus:ring-2 focus:ring-[#22C55E]/20"
                    placeholder="القاهرة"
                  />
                </div>
              </div>

              <button
                onClick={nextStep}
                className="w-full mt-8 flex items-center justify-center gap-2 py-3.5 bg-[#22C55E] text-white rounded-xl font-semibold hover:bg-[#16A34A] transition-all"
              >
                التالي
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 2: Owner Info + Submit */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-[#22C55E]" />
                </div>
                <div>
                  <h2 className="font-cairo font-bold text-xl">بيانات المالك</h2>
                  <p className="text-sm text-muted-c">
                    حسابك للدخول للوحة التحكم
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-soft">
                    الاسم الكامل *
                  </label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => updateField('ownerName', e.target.value)}
                    className="w-full bg-app border border-app rounded-xl py-3 px-4 text-strong placeholder:text-faint focus:outline-none focus:border-[#22C55E]/50 focus:ring-2 focus:ring-[#22C55E]/20"
                    placeholder="أحمد محمد"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-soft">
                      البريد الإلكتروني *
                    </label>
                    <input
                      type="email"
                      value={formData.ownerEmail}
                      onChange={(e) => updateField('ownerEmail', e.target.value)}
                      dir="ltr"
                      className="w-full bg-app border border-app rounded-xl py-3 px-4 text-strong placeholder:text-faint focus:outline-none focus:border-[#22C55E]/50 focus:ring-2 focus:ring-[#22C55E]/20 text-left"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-soft">
                      التليفون *
                    </label>
                    <input
                      type="tel"
                      value={formData.ownerPhone}
                      onChange={(e) => updateField('ownerPhone', e.target.value)}
                      dir="ltr"
                      className="w-full bg-app border border-app rounded-xl py-3 px-4 text-strong placeholder:text-faint focus:outline-none focus:border-[#22C55E]/50 focus:ring-2 focus:ring-[#22C55E]/20 text-left"
                      placeholder="01012345678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-soft">
                    كلمة المرور *
                  </label>
                  <input
                    type="password"
                    value={formData.ownerPassword}
                    onChange={(e) => updateField('ownerPassword', e.target.value)}
                    dir="ltr"
                    className="w-full bg-app border border-app rounded-xl py-3 px-4 text-strong placeholder:text-faint focus:outline-none focus:border-[#22C55E]/50 focus:ring-2 focus:ring-[#22C55E]/20 text-left"
                    placeholder="6 حروف على الأقل"
                  />
                  <PasswordStrength password={formData.ownerPassword} />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={prevStep}
                  className="px-6 py-3.5 border border-app text-strong rounded-xl font-semibold hover:surface transition-all"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#22C55E] text-white rounded-xl font-semibold hover:bg-[#16A34A] transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Gift className="w-5 h-5" />
                      ابدأ تجربتك المجانية
                    </>
                  )}
                </button>
              </div>

              <p className="text-center mt-4 text-xs text-faint">
                🎁 تجربة مجانية 7 أيام — استمتع بكل المميزات بدون دفع
              </p>
            </div>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-faint">
          عندك حساب بالفعل؟{' '}
          <Link
            href="/login"
            className="text-[#22C55E] font-medium hover:underline"
          >
            سجّل الدخول
          </Link>
        </p>
      </div>
    </div>
  )
}
