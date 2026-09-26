'use client'

import { useState, useRef, useEffect } from 'react'
import { useGymStore } from '@/store/gym-store'
import { Camera, X, CheckCircle2, AlertCircle, Clock, User, QrCode } from 'lucide-react'

interface AttendanceRecord {
  id: string
  checkInTime: string
  checkOutTime: string | null
  status: 'checked_in' | 'checked_out'
  member: {
    id: string
    fullName: string
    memberNumber: string
    phone: string | null
    subscriptions?: Array<{ endDate: string }>
  }
  subscription?: {
    endDate: string
  }
}

export default function CheckInPage() {
  const { gym } = useGymStore()
  const gymSlug = gym?.slug
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scanning, setScanning] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([])
  const [mode, setMode] = useState<'check_in' | 'check_out'>('check_in')

  // Load recent attendance
  useEffect(() => {
    if (!gymSlug) return
    loadRecentAttendance()
  }, [gymSlug])

  const loadRecentAttendance = async () => {
    if (!gymSlug) return
    try {
      const res = await fetch(`/api/gyms/${gymSlug}/attendance?limit=10`)
      const data = await res.json()
      if (res.ok) {
        setRecentAttendance(data.attendance || [])
      }
    } catch (err) {
      console.error('Failed to load attendance:', err)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setScanning(true)
      }
    } catch (err) {
      setError('فشل في الوصول للكاميرا. تأكد من السماح بالوصول.')
      console.error('Camera error:', err)
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setScanning(false)
  }

  const handleCheckIn = async (barcode: string) => {
    if (!gymSlug) return
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/gyms/${gymSlug}/attendance`, {
        method: mode === 'check_in' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: barcode.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || (mode === 'check_in' ? 'فشل تسجيل الحضور' : 'فشل تسجيل الانصراف'))
      }

      setSuccess(
        mode === 'check_in'
          ? `تم تسجيل حضور ${data.member.fullName} بنجاح!`
          : `تم تسجيل انصراف ${data.member.fullName} بنجاح!`
      )
      setManualInput('')
      await loadRecentAttendance()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualInput.trim()) {
      handleCheckIn(manualInput)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="font-cairo font-bold text-2xl">تسجيل الحضور والانصراف</h2>
        <p className="text-sm text-muted-c">امسح باركود العضو أو أدخله يدوياً</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 p-1 bg-app rounded-xl border border-app w-fit">
        <button
          onClick={() => setMode('check_in')}
          className={`px-5 py-2 rounded-lg font-cairo font-semibold text-sm transition-colors ${
            mode === 'check_in' ? 'bg-[#22C55E] text-white' : 'text-muted-c hover:text-strong'
          }`}
        >
          تسجيل حضور
        </button>
        <button
          onClick={() => setMode('check_out')}
          className={`px-5 py-2 rounded-lg font-cairo font-semibold text-sm transition-colors ${
            mode === 'check_out' ? 'bg-red-500 text-white' : 'text-muted-c hover:text-strong'
          }`}
        >
          تسجيل انصراف
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* Scanner Section */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-[#22C55E]" />
            </div>
            <h3 className="font-cairo font-bold text-lg">الماسح الضوئي</h3>
          </div>
          {!scanning ? (
            <button
              onClick={startCamera}
              className="flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-white rounded-xl hover:bg-[#22C55E]/90 transition-colors"
            >
              <Camera className="w-4 h-4" />
              تشغيل الكاميرا
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-500/90 transition-colors"
            >
              <X className="w-4 h-4" />
              إيقاف الكاميرا
            </button>
          )}
        </div>

        {scanning && (
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-4">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-32 border-2 border-[#22C55E] rounded-lg bg-[#22C55E]/10" />
            </div>
          </div>
        )}

        {/* Manual Input */}
        <form onSubmit={handleManualSubmit} className="mt-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="أدخل الباركود يدوياً..."
              className="flex-1 bg-app border border-app rounded-xl py-3 px-4 text-strong focus:outline-none focus:border-[#22C55E]/50 focus:ring-2 focus:ring-[#22C55E]/20"
              dir="ltr"
            />
            <button
              type="submit"
              disabled={loading || !manualInput.trim()}
              className="px-6 py-3 bg-[#22C55E] text-white rounded-xl hover:bg-[#22C55E]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري التسجيل...
                </>
              ) : (
                'تسجيل'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Attendance */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#22C55E]" />
          </div>
          <h3 className="font-cairo font-bold text-lg">آخر الحضور</h3>
        </div>

        {recentAttendance.length === 0 ? (
          <div className="text-center py-8 text-muted-c">
            لا يوجد سجلات حضور اليوم
          </div>
        ) : (
          <div className="space-y-3">
            {recentAttendance.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-4 bg-app rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-[#22C55E]" />
                  </div>
                  <div>
                    <p className="font-medium text-strong">{record.member.fullName}</p>
                    <p className="text-sm text-muted-c">{record.member.memberNumber}</p>
                  </div>
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2 justify-end">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        record.status === 'checked_in'
                          ? 'bg-[#22C55E]/10 text-[#22C55E]'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {record.status === 'checked_in' ? 'داخل الجيم' : 'انصرف'}
                    </span>
                    <p className="text-sm text-soft">
                      {new Date(record.checkInTime).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {record.checkOutTime && (
                        <>
                          {' → '}
                          {new Date(record.checkOutTime).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </>
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-muted-c">
                    {record.member?.subscriptions?.[0]?.endDate ? (
                      `ينتهي: ${new Date(record.member.subscriptions[0].endDate).toLocaleDateString('ar-EG')}`
                    ) : record.subscription?.endDate ? (
                      `ينتهي: ${new Date(record.subscription.endDate).toLocaleDateString('ar-EG')}`
                    ) : (
                      'عضو'
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}