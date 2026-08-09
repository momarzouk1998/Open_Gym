'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, 
  QrCode, 
  LogOut, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  CreditCard,
  Loader2,
  X,
  Camera
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
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const scannerRef = useRef<any>(null)

  useEffect(() => {
    const memberData = localStorage.getItem('memberData')
    if (!memberData) {
      router.push('/member-login')
      return
    }
    try {
      setMember(JSON.parse(memberData))
    } catch (e) {
      router.push('/member-login')
      return
    }
    setLoading(false)
  }, [router])

  // Camera QR Scanner instance for reading the Gym's wall QR code
  useEffect(() => {
    if (showCameraModal) {
      import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
        const scanner = new Html5QrcodeScanner(
          'gym-qr-reader',
          { fps: 10, qrbox: { width: 220, height: 220 } },
          /* verbose= */ false
        )
        scannerRef.current = scanner
        scanner.render(
          (decodedText: string) => {
            scanner.clear().catch(() => {})
            setShowCameraModal(false)
            handleScanGymBarcode(decodedText)
          },
          () => {
            // Ignore frame scan failures
          }
        )
      }).catch((err) => {
        console.error('Failed to load html5-qrcode:', err)
        setAttendanceMessage('تعذر فتح الكاميرا. يمكنك استخدام التسجيل المباشر.')
      })
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
      }
    }
  }, [showCameraModal])

  const handleLogout = () => {
    localStorage.removeItem('memberData')
    router.push('/member-login')
  }

  const handleScanGymBarcode = async (scannedText: string) => {
    if (!member) return
    setCheckingIn(true)
    setAttendanceMessage('جاري التحقق وسحب بيانات الحضور...')

    try {
      // Decode if text is a full URL like https://opengym.openappo.com/attendance/gymslug or raw barcode
      let gymSlugOrBarcode = scannedText.trim()
      if (gymSlugOrBarcode.includes('/attendance/')) {
        const parts = gymSlugOrBarcode.split('/attendance/')
        gymSlugOrBarcode = decodeURIComponent(parts[parts.length - 1])
      }

      // Verify matching gym barcode or slug
      if (
        member.gym.gymBarcode && 
        gymSlugOrBarcode !== member.gym.gymBarcode && 
        gymSlugOrBarcode !== member.gym.slug &&
        !scannedText.includes(member.gym.slug)
      ) {
        setAttendanceMessage('عذراً، هذا الباركود لا ينتمي لـ ' + member.gym.name)
        setCheckingIn(false)
        return
      }

      // Record attendance
      const res = await fetch(`/api/gyms/${encodeURIComponent(member.gym.slug)}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          barcode: member.barcode,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setAttendanceMessage('✅ تم تسجيل حضورك بنجاح!')
      } else {
        setAttendanceMessage(data.error || 'فشل تسجيل الحضور')
      }
    } catch (err) {
      setAttendanceMessage('حدث خطأ أثناء الاتصال بالسيرفر')
    } finally {
      setCheckingIn(false)
    }

    setTimeout(() => setAttendanceMessage(''), 4000)
  }

  const handleDirectAttendance = () => {
    if (!member) return
    handleScanGymBarcode(member.gym.gymBarcode || member.gym.slug)
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

    setTimeout(() => setAttendanceMessage(''), 4000)
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
            <p className="text-sm text-[#22C55E] font-medium">{member.gym.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-app hover:surface transition-colors"
            title="تسجيل الخروج"
          >
            <LogOut className="w-5 h-5 text-muted-c" />
          </button>
        </div>

        {/* Member Info Card */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center border border-[#22C55E]/30">
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

          {/* Subscription Status */}
          {activeSubscription ? (
            <div className="bg-[#22C55E]/10 p-4 rounded-xl border border-[#22C55E]/20">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-[#22C55E]" />
                <span className="text-sm text-soft">الاشتراك الحالي</span>
              </div>
              <p className="font-cairo font-bold text-[#22C55E] text-lg">
                {activeSubscription.plan.name}
              </p>
              <p className="text-xs text-muted-c mt-1">
                ينتهي في: {new Date(activeSubscription.endDate).toLocaleDateString('ar-EG')}
              </p>
            </div>
          ) : (
            <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20">
              <p className="text-sm text-red-400">عذراً، لا يوجد اشتراك نشط حالياً</p>
            </div>
          )}
        </div>

        {/* Attendance Section — Member scans Gym's printed QR barcode */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <h3 className="font-cairo font-bold text-lg text-white">تسجيل الحضور في الجيم</h3>
          
          <div className="space-y-3">
            <button
              onClick={() => setShowCameraModal(true)}
              disabled={checkingIn}
              className="w-full py-3.5 bg-[#22C55E] text-white rounded-xl font-cairo font-bold hover:bg-[#22C55E]/90 transition-colors flex items-center justify-center gap-2 text-base shadow-lg shadow-[#22C55E]/20"
            >
              <Camera className="w-5 h-5" />
              امسح باركود الجيم (كاميرا الموبايل)
            </button>

            <button
              onClick={handleDirectAttendance}
              disabled={checkingIn}
              className="w-full py-3 bg-app border border-app text-white rounded-xl font-cairo font-semibold hover:surface transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <QrCode className="w-4 h-4 text-[#22C55E]" />
              تسجيل بنقرة واحدة (داخل الجيم)
            </button>
          </div>

          {attendanceMessage && (
            <div className={`p-4 rounded-xl flex items-center gap-2 ${
              attendanceMessage.includes('نجاح') 
                ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {attendanceMessage.includes('نجاح') ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="text-sm">{attendanceMessage}</p>
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className="glass-card p-6 rounded-2xl">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full py-3 bg-app border border-app text-white rounded-xl font-cairo font-bold hover:surface transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Lock className="w-4 h-4" />
            تغيير كلمة المرور
          </button>
        </div>

        {/* Camera QR Modal */}
        {showCameraModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="glass-card p-6 rounded-2xl w-full max-w-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-cairo font-bold text-white text-base">وجه كاميرا الموبايل للباركود المعلق</h3>
                <button
                  onClick={() => setShowCameraModal(false)}
                  className="text-muted-c hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div id="gym-qr-reader" className="overflow-hidden rounded-xl bg-black min-h-[250px]" />

              <p className="text-xs text-muted-c text-center">
                امسح الـ QR المعلق على حائط الجيم لتسجيل حضورك تلقائياً
              </p>
            </div>
          </div>
        )}

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