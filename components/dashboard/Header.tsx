'use client'

import { Menu, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { NotificationBell } from '@/components/dashboard/NotificationBell'
import { useGymStore } from '@/store/gym-store'

interface HeaderProps {
  title: string
  onMenuClick: () => void
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return <span className="w-9 h-9" aria-hidden />

  const isLight = theme === 'light'
  return (
    <button
      onClick={() => setTheme(isLight ? 'dark' : 'light')}
      className="p-2 text-muted-c hover:text-strong transition-colors rounded-lg hover:surface"
      aria-label={isLight ? 'الوضع الغامق' : 'الوضع الفاتح'}
      title={isLight ? 'الوضع الغامق' : 'الوضع الفاتح'}
    >
      {isLight ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
    </button>
  )
}

interface ExpiringNotif {
  id: string
  title: string
  body: string
  time: string
  read: boolean
}

function useNotifications() {
  const { gym } = useGymStore()
  const [notifications, setNotifications] = useState<ExpiringNotif[]>([])

  useEffect(() => {
    if (!gym?.slug) return

    const loadNotifs = () => {
      fetch(`/api/gyms/${gym.slug}/expiring?days=3`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data?.expiring) return
          const notifs: ExpiringNotif[] = data.expiring
            .slice(0, 10)
            .map(
              (sub: {
                id: string
                member: { fullName: string }
                plan: { name: string }
                endDate: string
              }) => {
                const daysLeft = Math.ceil(
                  (new Date(sub.endDate).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                )
                return {
                  id: sub.id,
                  title: `اشتراك ${sub.member.fullName} ينتهي قريباً`,
                  body: `خطة ${sub.plan.name} — ينتهي خلال ${daysLeft} ${
                    daysLeft === 1 ? 'يوم' : 'أيام'
                  }`,
                  time: new Date(sub.endDate).toLocaleDateString('ar-EG'),
                  read: false,
                }
              }
            )
          setNotifications(notifs)
        })
        .catch(() => {})
    }

    loadNotifs()
    // Poll every 5 minutes (300,000 ms)
    const interval = setInterval(loadNotifs, 300000)
    return () => clearInterval(interval)
  }, [gym?.slug])

  return notifications
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { user } = useGymStore()
  const notifications = useNotifications()
  const userInitial = (user?.fullName || user?.name || 'م').charAt(0)

  return (
    <header className="sticky top-0 z-30 bg-app/80 backdrop-blur-lg border-b border-app">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -mr-2 text-strong"
            aria-label="القائمة"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-cairo font-bold text-lg sm:text-xl">{title}</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />

          <NotificationBell
            unreadCount={notifications.length}
            notifications={notifications}
          />

          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#22C55E] to-[#16A34A] flex items-center justify-center text-white font-bold text-sm font-cairo">
            {userInitial}
          </div>
        </div>
      </div>
    </header>
  )
}
