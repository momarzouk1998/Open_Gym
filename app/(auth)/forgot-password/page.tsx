'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Mail, Loader2, CheckCircle2 } from 'lucide-react'
import { Logo } from '@/components/Logo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'حدث خطأ')
      // Always show the generic success message (prevents email enumeration)
      setSent(true)
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
            نسيت كلمة المرور؟
          </h1>
          <p className="text-muted-c text-center mb-8">
            اكتب بريدك الإلكتروني وهنبعتلك رابط لتغيير كلمة المرور
          </p>

          {sent ? (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-sm text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                لو الإيميل مسجّل، هتوصلك رسالة بتغيير كلمة المرور
              </div>
              <p className="text-sm text-muted-c text-center">
                اتكلّف تشيك الإيميل (بما فيه سبام/جنك ميل). الرابط صالح لمدة ساعة.
              </p>
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#22C55E] text-white rounded-xl font-semibold hover:bg-[#16A34A] transition-all"
              >
                العودة لتسجيل الدخول
                <ArrowLeft className="w-5 h-5" />
              </Link>
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
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-faint" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      dir="ltr"
                      className={`${inputClass} pr-11 text-left`}
                      placeholder="you@example.com"
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
                      إرسال رابط التغيير
                      <ArrowLeft className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-c">
                  تذكّرت كلمة المرور؟{' '}
                  <Link
                    href="/login"
                    className="text-[#22C55E] font-medium hover:underline"
                  >
                    تسجيل الدخول
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-faint">
          <Link href="/" className="hover:text-[#22C55E] transition-colors inline-flex items-center gap-1">
            <ArrowRight className="w-4 h-4" />
            العودة للرئيسية
          </Link>
        </p>
      </div>
    </div>
  )
}
