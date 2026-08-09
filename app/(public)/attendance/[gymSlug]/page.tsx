'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Phone, Lock, Loader2, Activity, CheckCircle, XCircle } from 'lucide-react'

export default function AttendancePage() {
  const router = useRouter()
  const params = useParams()
  const gymSlug = params.gymSlug as string
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [gymName, setGymName] = useState('')
  const [form, setForm] = useState({
    phone: '',
    password: '',
  })

  useEffect(() => {
    // Pre-fill phone if stored from previous login
    const memberData = localStorage.getItem('memberData')
    if (memberData) {
      try {
        const data = JSON.parse(memberData)
        if (data.phone) {
          setForm(prev => ({ ...prev, phone: data.phone }))
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // First, login to get member data
      const loginRes = await fetch('/api/member/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const loginData = await loginRes.json()

      if (!loginRes.ok) {
        throw new Error(loginData.error || 'فشل تسجيل الدخول')
      }

      // Check if member belongs to this gym
      if (loginData.member.gym.slug !== gymSlug) {
        throw new Error('هذا الحساب لا ينتمي لهذا الجيم')
      }

      // Store member data
      localStorage.setItem('memberData', JSON.stringify(loginData.member))
      setGymName(loginData.member.gym.name)

      // Record attendance
      const attendanceRes = await fetch(`/api/gyms/${encodeURIComponent(gymSlug)}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: loginData.member.barcode,
        }),
      })

      const attendanceData = await attendanceRes.json()

      if (!attendanceRes.ok) {
        throw new Error(attendanceData.error || 'فشل تسجيل الحضور')
      }

      setSuccess(true)
      
      // Auto-redirect after 3 seconds
      setTimeout(() => {
        router.push('/member/dashboard')
      }, 3000)
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
          <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center mx-auto mb-4 border border-[#22C55E]/30">
            <Activity className="w-8 h-8 text-[#22C55E]" />
          </div>
          <h1 className="font-cairo font-bold text-2xl text-white mb-2">تسجيل الحضور</h1>
          <p className="text-sm text-muted-c">أدخل رقم التليفون وكلمة المرور</p>
          {gymName && (
            <p className="text-lg font-semibold text-[#22C55E] mt-2">{gymName}</p>
          )}
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-[#22C55E]/10 flex items-center justify-center mx-auto mb-4 border border-[#22C55E]/30">
              <CheckCircle className="w-10 h-10 text-[#22C55E]" />
            </div>
            <h2 className="font-cairo font-bold text-xl text-white mb-2">تم تسجيل الحضور بنجاح!</h2>
            <p className="text-sm text-muted-c mb-4">سيتم التحويل للوحة التحكم...</p>
            <div className="animate-pulse">
              <div className="h-2 bg-[#22C55E]/20 rounded-full overflow-hidden">
                <div className="h-full bg-[#22C55E] animate-[progress_3s_ease-out]" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6 flex items-start gap-3">
                <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
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
                    جاري تسجيل الحضور...
                  </>
                ) : (
                  <>
                    تسجيل الحضور
                    <Activity className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-c">
                ليس لديك حساب؟{' '}
                <button
                  onClick={() => router.push('/member-login')}
                  className="text-[#22C55E] hover:text-[#22C55E]/80 transition-colors"
                >
                  تواصل مع صاحب الجيم
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}