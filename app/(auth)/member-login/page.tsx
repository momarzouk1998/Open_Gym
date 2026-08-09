'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Phone, Lock, ArrowRight, Loader2 } from 'lucide-react'

function MemberLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    phone: '',
    password: '',
  })

  useEffect(() => {
    // Pre-fill phone if provided in URL
    const phoneParam = searchParams.get('phone')
    if (phoneParam) {
      setForm(prev => ({ ...prev, phone: phoneParam }))
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/member/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'فشل تسجيل الدخول')
      }

      // Store member data in localStorage
      localStorage.setItem('memberData', JSON.stringify(data.member))
      
      // Redirect to member dashboard
      router.push('/member/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]">
      <div className="max-w-md w-full glass-card p-8 rounded-2xl">
        <div className="text-center mb-8">
          <h1 className="font-cairo font-bold text-2xl text-white mb-2">تسجيل دخول العضو</h1>
          <p className="text-sm text-muted-c">أدخل رقم التليفون وكلمة المرور</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-soft">
              رقم التليفون
            </label>
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-faint" />
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-app border border-app rounded-xl py-3 px-4 pr-10 text-strong focus:outline-none focus:border-[#22C55E]/50 focus:ring-2 focus:ring-[#22C55E]/20"
                placeholder="01012345678"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-soft">
              كلمة المرور
            </label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-faint" />
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-app border border-app rounded-xl py-3 px-4 pr-10 text-strong focus:outline-none focus:border-[#22C55E]/50 focus:ring-2 focus:ring-[#22C55E]/20"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#22C55E] text-white rounded-xl font-cairo font-bold hover:bg-[#22C55E]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري تسجيل الدخول...
              </>
            ) : (
              <>
                تسجيل الدخول
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-c">
            ليس لديك حساب؟{' '}
            <button
              onClick={() => router.push('/dashboard')}
              className="text-[#22C55E] hover:text-[#22C55E]/80 transition-colors"
            >
              تواصل مع صاحب الجيم
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function MemberLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]">
        <Loader2 className="w-8 h-8 animate-spin text-[#22C55E]" />
      </div>
    }>
      <MemberLoginForm />
    </Suspense>
  )
}