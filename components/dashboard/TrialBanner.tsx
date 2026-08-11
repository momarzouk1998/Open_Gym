'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useGymStore } from '@/store/gym-store'
import { motion, AnimatePresence } from 'motion/react'
import { Sparkles, X, Clock, ArrowLeft, Megaphone, AlertTriangle, AlertCircle } from 'lucide-react'

export function TrialBanner() {
  const { gym, user } = useGymStore()
  const [dismissed, setDismissed] = useState(false)

  const sessionKey = `trial-banner-dismissed-${gym?.id}`
  const [wasDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem(sessionKey) === '1'
  })

  // Safe type cast for optional/dynamic schema fields
  const gymExt = gym as unknown as {
    broadcastBanner?: string | null
    gracePeriodDays?: number | null
    warningDays?: number | null
    nextBillingDate?: string | Date | null
  }

  const broadcastMsg = gymExt?.broadcastBanner
  const graceDays = gymExt?.gracePeriodDays ?? 3
  const warningDays = gymExt?.warningDays ?? 3

  // Determine key dates
  const expiryDate = useMemo(() => {
    const raw = gymExt?.nextBillingDate || gym?.trialEndsAt
    if (!raw) return null
    return new Date(raw)
  }, [gymExt?.nextBillingDate, gym?.trialEndsAt])

  const { isWarningPhase, isGracePhase, isExpiredPhase, daysUntilExpiry, daysLeftInGrace } = useMemo(() => {
    if (!expiryDate) {
      return { isWarningPhase: false, isGracePhase: false, isExpiredPhase: false, daysUntilExpiry: 999, daysLeftInGrace: 0 }
    }
    const now = new Date()
    const graceEnd = new Date(expiryDate.getTime() + graceDays * 24 * 60 * 60 * 1000)

    const diffExpiryMs = expiryDate.getTime() - now.getTime()
    const daysUntil = Math.ceil(diffExpiryMs / (1000 * 60 * 60 * 24))

    const diffGraceMs = graceEnd.getTime() - now.getTime()
    const daysInGrace = Math.ceil(diffGraceMs / (1000 * 60 * 60 * 24))

    const isExpired = now > graceEnd || gym?.status === 'suspended' || gym?.status === 'cancelled'
    const isGrace = !isExpired && now > expiryDate
    const isWarn = !isExpired && !isGrace && daysUntil <= warningDays

    return {
      isWarningPhase: isWarn,
      isGracePhase: isGrace,
      isExpiredPhase: isExpired,
      daysUntilExpiry: Math.max(0, daysUntil),
      daysLeftInGrace: Math.max(0, daysInGrace),
    }
  }, [expiryDate, graceDays, warningDays, gym?.status])

  const isTrial = gym?.status === 'trial'
  const shouldShow =
    (isTrial || broadcastMsg || isWarningPhase || isGracePhase || isExpiredPhase) &&
    user?.role !== 'super_admin' &&
    !dismissed &&
    !wasDismissed

  if (!shouldShow) return null

  const handleDismiss = () => {
    setDismissed(true)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(sessionKey, '1')
    }
  }

  // 1️⃣ Custom Admin Broadcast Banner takes top priority
  if (broadcastMsg) {
    return (
      <div className="relative flex items-center justify-between gap-4 px-4 sm:px-6 py-3 bg-[#F59E0B]/10 border-b border-[#F59E0B]/20 text-[#F59E0B]">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-lg bg-[#F59E0B]/20 flex items-center justify-center flex-shrink-0">
            <Megaphone className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-[#F59E0B] block">تنبيه إداري من منصة OpenGym:</span>
            <p className="text-sm font-bold text-white truncate">
              {broadcastMsg}
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg text-faint hover:text-strong hover:bg-black/10 transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // 2️⃣ Suspended / Expired Phase (الحظر النهائي)
  if (isExpiredPhase) {
    return (
      <div className="relative flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5 bg-red-500/20 border-b border-red-500/40 text-red-300">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-lg bg-red-500/30 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-red-400 block">❌ تم إيقاف حساب الجيم</span>
            <p className="text-sm font-bold text-white truncate">
              انتهى تاريخ اشتراكك وانقضت فترة السماح. يرجى التواصل مع إدارة المنصة للتفعيل والتجديد.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 3️⃣ Grace Period Phase (فترة السماح)
  if (isGracePhase) {
    return (
      <div className="relative flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5 bg-amber-500/20 border-b border-amber-500/40 text-amber-300">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-lg bg-amber-500/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-amber-400 block">🚨 أنت الآن في فترة السماح!</span>
            <p className="text-sm font-bold text-white truncate">
              انتهى موعد الاشتراك وباقي <strong className="text-amber-400">{daysLeftInGrace} يوم</strong> فقط في فترة السماح قبل الحظر التام.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/plans"
          className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors whitespace-nowrap"
        >
          جدّد الآن
        </Link>
      </div>
    )
  }

  // 4️⃣ Early Warning Phase (تنبيه مبكر قبل الانتهاء)
  if (isWarningPhase) {
    return (
      <div className="relative flex items-center justify-between gap-4 px-4 sm:px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 text-amber-400">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-amber-400 block">⚠️ تنبيه التجديد المبكر</span>
            <p className="text-sm font-medium text-white truncate">
              باقي <strong className="text-amber-400 font-bold">{daysUntilExpiry} {daysUntilExpiry === 1 ? 'يوم' : 'أيام'}</strong> على انتهاء الاشتراك. يرجى التجديد لضمان استمرار الخدمة.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/plans"
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors whitespace-nowrap"
          >
            تجديد الاشتراك
          </Link>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-faint hover:text-strong hover:bg-black/10 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // 5️⃣ Standard Trial Banner (فترة التجربة الأساسية)
  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="relative flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b bg-[#22C55E]/10 border-[#22C55E]/20">
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#22C55E]" />

            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-lg bg-[#22C55E]/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-[#22C55E]" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-strong truncate">
                  تجربتك المجانية باقي <span className="font-bold text-[#22C55E]">{daysUntilExpiry} يوم</span> — استمتع بكل المميزات مجاناً
                </p>
                <p className="text-xs text-faint truncate hidden sm:block">
                  كل الإضافات مفتوحة دلوقتي، جرّبها كلها قبل ما تختار باقتك
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href="/dashboard/plans"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#22C55E] text-white hover:bg-[#16A34A] transition-colors"
              >
                شوف الباقات والأسعار
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>

              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg text-faint hover:text-strong hover:bg-black/10 transition-colors"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
