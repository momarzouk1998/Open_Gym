'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, Lock, ArrowLeft, Loader2, User } from 'lucide-react'

export function MemberLogin() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    phone: '',
    password: '',
  })

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
    <div className="glass-card p-6 sm:p-8 rounded-2xl border border-[#22C55E]/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#22C55E]/10 flex items-center justify-center border border-[#22C55E]/30">
          <User className="w-6 h-6 text-[#22C55E]" />
        </div>
        <div>
          <h3 className="font-cairo font-bold text-xl text-strong">دخول الأعضاء</h3>
          <p className="text-sm text-muted-c">أدخل رقم التليفون وكلمة المرور</p>
        </div>
      </div>



      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
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
              placeholder="•••••••••"
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
              <ArrowLeft className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-4 pt-4 border-t border-app text-center">
        <p className="text-sm text-muted-c">
          ليس لديك حساب؟ تواصل مع صاحب الجيم
        </p>
      </div>
    </div>
  )
}