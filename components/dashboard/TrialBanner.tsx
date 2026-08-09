'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useGymStore } from '@/store/gym-store'
import { motion, AnimatePresence } from 'motion/react'
import { Sparkles, X, Clock, ArrowLeft } from 'lucide-react'

/**
 * Trial banner shown at the top of the dashboard during the 7-day trial.
 *
 * - Counts days remaining from gym.trialEndsAt
 * - Dismissible for the current session (sessionStorage)
 * - Turns red/urgent in the final 3 days
 * - Hidden for super_admin (they don't have a trial)
 */
export function TrialBanner() {
  const { gym, user } = useGymStore()
  const [dismissed, setDismissed] = useState(false)

  // Check sessionStorage for session-level dismissal
  const sessionKey = `trial-banner-dismissed-${gym?.id}`
  const [wasDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem(sessionKey) === '1'
  })

  const trialEnd = gym?.trialEndsAt
  const daysLeft = useMemo(() => {
    if (!trialEnd) return null
    const end = new Date(trialEnd)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }, [trialEnd])

  // Only show for gyms in trial status, not super_admin, with days left, not dismissed
  const isTrial = gym?.status === 'trial'
  const shouldShow =
    isTrial &&
    user?.role !== 'super_admin' &&
    daysLeft !== null &&
    daysLeft > 0 &&
    !dismissed &&
    !wasDismissed

  if (!shouldShow) return null

  // Urgency: final 3 days = red, otherwise green
  const isUrgent = daysLeft !== null && daysLeft <= 3

  const handleDismiss = () => {
    setDismissed(true)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(sessionKey, '1')
    }
  }

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
          <div
            className={`relative flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b ${
              isUrgent
                ? 'bg-[#EF4444]/10 border-[#EF4444]/20'
                : 'bg-[#22C55E]/10 border-[#22C55E]/20'
            }`}
          >
            {/* Decorative left accent */}
            <div
              className={`absolute right-0 top-0 bottom-0 w-1 ${
                isUrgent ? 'bg-[#EF4444]' : 'bg-[#22C55E]'
              }`}
            />

            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isUrgent
                    ? 'bg-[#EF4444]/20'
                    : 'bg-[#22C55E]/20'
                }`}
              >
                {isUrgent ? (
                  <Clock className="w-5 h-5 text-[#EF4444]" />
                ) : (
                  <Sparkles className="w-5 h-5 text-[#22C55E]" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                {isUrgent ? (
                  <p className="text-sm font-medium text-strong truncate">
                    باقي{' '}
                    <span className="font-bold text-[#EF4444]">
                      {daysLeft} {daysLeft === 1 ? 'يوم' : 'أيام'}
                    </span>{' '}
                    على انتهاء التجربة — اشترك عشان تكمل
                  </p>
                ) : (
                  <p className="text-sm font-medium text-strong truncate">
                    تجربتك المجانية باقي{' '}
                    <span className="font-bold text-[#22C55E]">{daysLeft} يوم</span>{' '}
                    — استمتع بكل المميزات مجاناً
                  </p>
                )}
                <p className="text-xs text-faint truncate hidden sm:block">
                  كل الإضافات مفتوحة دلوقتي، جرّبها كلها قبل ما تختار باقتك
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href="/dashboard/plans"
                className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isUrgent
                    ? 'bg-[#EF4444] text-white hover:bg-[#DC2626]'
                    : 'bg-[#22C55E] text-white hover:bg-[#16A34A]'
                }`}
              >
                شوف الباقات والأسعار
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>

              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg text-faint hover:text-strong hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
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
