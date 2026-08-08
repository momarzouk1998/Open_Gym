'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Mail, Lock, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Logo } from '@/components/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        // result.error may contain the rate-limit message thrown from authorize()
        if (result.error.includes('محاولات كثيرة')) {
          setError(result.error)
        } else {
          setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
        }
      } else if (result?.ok) {
        // Use /api/auth/me which is the canonical source of role data in this app.
        // Falls back to /dashboard if the request fails (safe default for gym owners).
        try {
          const res = await fetch('/api/auth/me')
          if (res.ok) {
            const data = await res.json()
            if (data?.user?.role === 'super_admin') {
              router.push('/admin')
            } else {
              router.push('/dashboard')
            }
          } else {
            router.push('/dashboard')
          }
        } catch {
          // Network error after successful login — still safe to redirect
          router.push('/dashboard')
        }
      } else {
        // Fallback: result is neither ok nor error (e.g. network hiccup)
        setError('حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى')
      }
    } catch {
      setError('تعذّر الاتصال بالسيرفر، تحقق من الإنترنت وحاول مرة أخرى')
    } finally {
      // Always reset loading — button never gets stuck
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 grid-bg relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[#22C55E]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Logo variant="full" width={180} height={56} priority />
        </Link>

        <div className="glass-card p-8 rounded-2xl">
          <h1 className="font-cairo font-bold text-2xl text-center mb-2">
            مرحباً بك
          </h1>
          <p className="text-muted-c text-center mb-8">
            سجّل دخولك للوحة التحكم
          </p>

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
                  className="w-full bg-app border border-app rounded-xl py-3 pr-11 pl-4 text-strong placeholder:text-faint focus:outline-none focus:border-[#22C55E]/50 focus:ring-2 focus:ring-[#22C55E]/20 transition-all text-left"
                  placeholder="you@example.com"
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
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  dir="ltr"
                  className="w-full bg-app border border-app rounded-xl py-3 pr-11 pl-11 text-strong placeholder:text-faint focus:outline-none focus:border-[#22C55E]/50 focus:ring-2 focus:ring-[#22C55E]/20 transition-all text-left"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-faint hover:text-strong"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-[#22C55E] hover:underline"
              >
                نسيت كلمة المرور؟
              </Link>
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
                  تسجيل الدخول
                  <ArrowLeft className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-c">
              ليك حساب جديد؟{' '}
              <Link
                href="/register"
                className="text-[#22C55E] font-medium hover:underline"
              >
                سجّل جيمك
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-faint">
          <Link href="/" className="hover:text-[#22C55E] transition-colors">
            ← العودة للرئيسية
          </Link>
        </p>
      </div>
    </div>
  )
}
