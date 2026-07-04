'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, KeyRound, Lock, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { Logo } from '@/components/Logo'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const email = (searchParams.get('email') || '').toLowerCase()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const validLink = Boolean(token && email)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('كلمة المرور الجديدة لازم 6 حروف على الأقل')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('كلمة المرور وتأكيدها غير متطابقين')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل التغيير')
      setDone(true)
      // Redirect to login after a short pause
      setTimeout(() => router.push('/login'), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full bg-app border border-app rounded-xl py-3 px-4 text-strong focus:outline-none focus:border-[#22C55E]/50 focus:ring-2 focus:ring-[#22C55E]/20'

  return (
    <div className="min-h-screen flex items-center justify-center px-4 grid-bg relative overflow-hidden">
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[#22C55E]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Logo variant="full" width={180} height={56} priority />
        </Link>

        <div className="glass-card p-8 rounded-2xl">
          <h1 className="font-cairo font-bold text-2xl text-center mb-2">
            تغيير كلمة المرور
          </h1>
          <p className="text-muted-c text-center mb-8">
            {email && `للحساب ${email}`}
          </p>

          {!validLink ? (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                الرابط غير صالح أو غير مكتمل. اتكلّف تطلب رابط جديد.
              </div>
              <Link
                href="/forgot-password"
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#22C55E] text-white rounded-xl font-semibold hover:bg-[#16A34A] transition-all"
              >
                طلب رابط جديد
              </Link>
            </div>
          ) : done ? (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-sm text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                تم تغيير كلمة المرور بنجاح
              </div>
              <p className="text-sm text-muted-c text-center">
                هتحوّلك لتسجيل الدخول دلوقتي...
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2 text-soft">
                    كلمة المرور الجديدة *
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-faint" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      dir="ltr"
                      className={`${inputClass} pr-11 pl-11 text-left`}
                      placeholder="6 حروف على الأقل"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-faint hover:text-strong"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-soft">
                    تأكيد كلمة المرور *
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-faint" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      dir="ltr"
                      className={`${inputClass} pr-11 text-left`}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#22C55E] text-white rounded-xl font-semibold hover:bg-[#16A34A] transition-all hover:shadow-lg hover:shadow-[#22C55E]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      تغيير كلمة المرور
                      <ArrowLeft className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-faint">
          <Link href="/login" className="hover:text-[#22C55E] transition-colors inline-flex items-center gap-1">
            <ArrowRight className="w-4 h-4" />
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#22C55E]" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
