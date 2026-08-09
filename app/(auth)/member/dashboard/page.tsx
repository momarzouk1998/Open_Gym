'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, 
  QrCode, 
  LogOut, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  CreditCard,
  Loader2,
  X
} from 'lucide-react'

interface MemberData {
  id: string
  fullName: string
  phone: string | null
  memberNumber: string | null
  barcode: string | null
  gym: {
    id: string
    name: string
    slug: string
    gymBarcode: string | null
  }
  subscriptions: Array<{
    id: string
    endDate: string
    plan: {
      name: string
    }
  }>
}

export default function MemberDashboard() {
  const router = useRouter()
  const [member, setMember] = useState<MemberData | null>(null)
  const [loading, setLoading] = useState(true)
  const [attendanceMessage, setAttendanceMessage] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    const memberData = localStorage.getItem('memberData')
    if (!memberData) {
      router.push('/member-login')
      return
    }
    setMember(JSON.parse(memberData))
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('memberData')
    router.push('/member-login')
  }

  const startCamera = async () => {
    // For now, just use manual attendance inside the gym
    // QR scanning can be added later with proper library integration
    setAttendanceMessage('استخدم زر "تسجيل بدون مسح" داخل الجيم')
  }

  const stopCamera = () => {
    setScanning(false)
  }

  const handleScanGymBarcode = async (gymBarcode: string) => {
    if (!member) return
    setAttendanceMessage('جاري التحقق...')

    try {
      // Verify it's the correct gym barcode
      if (gymBarcode !== member.gym.gymBarcode) {
        setAttendanceMessage('هذا ليس باركود الجيم الصحيح')
        return
      }

      // Record attendance using the correct API format
      const res = await fetch(`/api/gyms/${member.gym.slug}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          memberId: member.id,
          memberBarcode: member.barcode,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setAttendanceMessage('تم تسجيل حضورك بنجاح!')
      } else {
        setAttendanceMessage(data.error || 'فشل تسجيل الحضور')
      }
    } catch (err) {
      setAttendanceMessage('حدث خطأ في تسجيل الحضور')
    }

    setTimeout(() => setAttendanceMessage(''), 3000)
  }

  const handleManualAttendance = () => {
    if (!member?.gym.gymBarcode) {
      setAttendanceMessage('لم يتم تعيين باركود للجيم')
      return
    }
    handleScanGymBarcode(member.gym.gymBarcode)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!member) return

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setAttendanceMessage('كلمة المرور الجديدة غير متطابقة')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setAttendanceMessage('كلمة المرور لازم 6 حروف على الأقل')
      return
    }

    setPasswordLoading(true)
    setAttendanceMessage('')

    try {
      const res = await fetch('/api/member/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setAttendanceMessage('تم تغيير كلمة المرور بنجاح')
        setShowPasswordModal(false)
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setAttendanceMessage(data.error || 'فشل تغيير كلمة المرور')
      }
    } catch (err) {
      setAttendanceMessage('حدث خطأ في تغيير كلمة المرور')
    } finally {
      setPasswordLoading(false)
    }

    setTimeout(() => setAttendanceMessage(''), 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#22C55E]" />
      </div>
    )
  }

  if (!member) return null

  const activeSubscription = member.subscriptions[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-cairo font-bold text-2xl text-white">مرحباً، {member.fullName}</h1>
            <p className="text-sm text-muted-c">{member.gym.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-app hover:surface transition-colors"
          >
            <LogOut className="w-5 h-5 text-muted-c" />
          </button>
        </div>

        {/* Member Info Card */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
              <User className="w-8 h-8 text-[#22C55E]" />
            </div>
            <div>
              <h2 className="font-cairo font-bold text-xl text-white">{member.fullName}</h2>
              {member.phone && (
                <p className="text-sm text-muted-c font-mono" dir="ltr">
                  {member.phone}
                </p>
              )}
            </div>
          </div>

          {/* Member Barcode */}
          {member.barcode && (
            <div className="bg-app p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-soft">باركودك</span>
                <QrCode className="w-4 h-4 text-[#22C55E]" />
              </div>
              <p className="text-lg font-mono text-strong text-center py-2" dir="ltr">
                {member.barcode}
              </p>
            </div>
          )}

          {/* Subscription Status */}
          {activeSubscription ? (
            <div className="bg-[#22C55E]/10 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-[#22C55E]" />
                <span className="text-sm text-soft">الاشتراك الحالي</span>
              </div>
              <p className="font-cairo font-bold text-[#22C55E]">
                {activeSubscription.plan.name}
              </p>
              <p className="text-sm text-muted-c">
                ينتهي: {new Date(activeSubscription.endDate).toLocaleDateString('ar-EG')}
              </p>
            </div>
          ) : (
            <div className="bg-red-500/10 p-4 rounded-xl">
              <p className="text-sm text-red-400">لا يوجد اشتراك نشط</p>
            </div>
          )}
        </div>

        {/* Attendance Section */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="font-cairo font-bold text-lg text-white mb-4">تسجيل الحضور</h3>
          
          <div className="space-y-3">
            <button
              onClick={handleManualAttendance}
              className="w-full py-3 bg-[#22C55E] text-white rounded-xl font-cairo font-bold hover:bg-[#22C55E]/90 transition-colors flex items-center justify-center gap-2"
            >
              <QrCode className="w-5 h-5" />
              تسجيل الحضور (داخل الجيم)
            </button>
            <div className="text-center text-xs text-muted-c">
              أو امسح باركود الجيم من أي تطبيق ماسح
            </div>
          </div>

          {attendanceMessage && (
            <div className={`mt-4 p-4 rounded-xl flex items-center gap-2 ${
              attendanceMessage.includes('نجاح') 
                ? 'bg-green-500/10 text-green-400' 
                : 'bg-red-500/10 text-red-400'
            }`}>
              {attendanceMessage.includes('نجاح') ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <p className="text-sm">{attendanceMessage}</p>
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className="glass-card p-6 rounded-2xl">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full py-3 bg-app border border-app text-white rounded-xl font-cairo font-bold hover:surface transition-colors flex items-center justify-center gap-2"
          >
            <Lock className="w-5 h-5" />
            تغيير كلمة المرور
          </button>
        </div>

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="glass-card p-6 rounded-2xl w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-cairo font-bold text-lg text-white">تغيير كلمة المرور</h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-muted-c hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-soft">
                    كلمة المرور الحالية
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full bg-app border border-app rounded-xl py-3 px-4 text-strong focus:outline-none focus:border-[#22C55E]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-soft">
                    كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full bg-app border border-app rounded-xl py-3 px-4 text-strong focus:outline-none focus:border-[#22C55E]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-soft">
                    تأكيد كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full bg-app border border-app rounded-xl py-3 px-4 text-strong focus:outline-none focus:border-[#22C55E]/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full py-3 bg-[#22C55E] text-white rounded-xl font-cairo font-bold hover:bg-[#22C55E]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري التغيير...
                    </>
                  ) : (
                    'تغيير كلمة المرور'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}