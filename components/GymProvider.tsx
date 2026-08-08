'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useGymStore } from '@/store/gym-store'
import { Loader2, AlertCircle, RefreshCcw } from 'lucide-react'

interface GymProviderProps {
  children: React.ReactNode
}

export function GymProvider({ children }: GymProviderProps) {
  const { data: session, status } = useSession()
  const { initialize, initialized, reset } = useGymStore()
  const router = useRouter()
  const initRef = useRef(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    // Reset when session changes (logout)
    if (status === 'unauthenticated') {
      reset()
      setFetchError(null)
      return
    }

    if (status === 'authenticated' && session?.user?.id && !initRef.current) {
      initRef.current = true
      setFetchError(null)

      fetch('/api/auth/me')
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })
        .then((data) => {
          // Guard: if the API returned no gym, the account is broken — redirect to login
          if (!data.gym) {
            console.error('GymProvider: no gym linked to this account')
            signOut({ callbackUrl: '/login?error=no_gym' })
            return
          }
          initialize({
            gym: data.gym,
            user: data.user,
            gyms: data.gyms,
          })
        })
        .catch((err) => {
          console.error('Failed to initialize gym store:', err)
          initRef.current = false
          setFetchError('تعذّر تحميل بيانات جيمك. تحقق من الإنترنت وحاول مرة أخرى.')
        })
    }
  }, [session, status, initialize, reset, router])

  // Reset initRef when session changes
  useEffect(() => {
    if (status === 'loading') {
      initRef.current = false
      setFetchError(null)
    }
  }, [status])

  // Show error state when /api/auth/me fails
  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="font-cairo font-bold text-xl mb-2">حدث خطأ في التحميل</h2>
          <p className="text-muted-c text-sm mb-6">{fetchError}</p>
          <button
            onClick={() => {
              initRef.current = false
              setFetchError(null)
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#22C55E] text-white rounded-xl font-semibold hover:bg-[#16A34A] transition-all"
          >
            <RefreshCcw className="w-4 h-4" />
            إعادة المحاولة
          </button>
        </div>
      </div>
    )
  }

  // Show loading while initializing (but not if we already have data)
  if (!initialized && status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app">
        <Loader2 className="w-8 h-8 animate-spin text-[#22C55E]" />
      </div>
    )
  }

  return <>{children}</>
}
