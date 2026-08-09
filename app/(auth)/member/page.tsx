'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { QrCode, Camera, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react'

export default function MemberPage() {
  const searchParams = useSearchParams()
  const memberCode = searchParams.get('code')
  const [memberData, setMemberData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [attendanceMessage, setAttendanceMessage] = useState('')

  useEffect(() => {
    if (memberCode) {
      loadMemberData(memberCode)
    }
  }, [memberCode])

  const loadMemberData = async (code: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/member/by-code?code=${code}`)
      const data = await res.json()
      if (res.ok) {
        setMemberData(data)
      } else {
        setError(data.error || 'فشل تحميل بيانات العضو')
      }
    } catch (err) {
      setError('حدث خطأ في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const copyBarcode = () => {
    if (memberData?.barcode) {
      navigator.clipboard.writeText(memberData.barcode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSelfCheckIn = async () => {
    if (!memberData?.barcode) return
    setScanning(true)
    setAttendanceMessage('')

    try {
      const res = await fetch(`/api/gyms/${memberData.gymSlug}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: memberData.barcode }),
      })

      const data = await res.json()
      if (res.ok) {
        setAttendanceMessage('تم تسجيل حضورك بنجاح!')
      } else {
        setAttendanceMessage(data.error || 'فشل تسجيل الحضور')
      }
    } catch (err) {
      setAttendanceMessage('حدث خطأ في تسجيل الحضور')
    } finally {
      setScanning(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#22C55E]/30 border-t-[#22C55E] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-c">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  if (error || !memberData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card p-6 rounded-2xl text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="font-cairo font-bold text-xl mb-2">خطأ</h2>
          <p className="text-muted-c mb-4">{error || 'لم يتم العثور على بيانات العضو'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-cairo font-bold text-2xl text-white mb-2">بطاقة العضو</h1>
          <p className="text-muted-c">{memberData.gymName}</p>
        </div>

        {/* Member Card */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
              <QrCode className="w-8 h-8 text-[#22C55E]" />
            </div>
            <div>
              <h2 className="font-cairo font-bold text-xl text-white">{memberData.fullName}</h2>
              <p className="text-sm text-muted-c">{memberData.memberNumber}</p>
            </div>
          </div>

          {/* Barcode Display */}
          <div className="bg-app p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-soft">باركود العضو</span>
              <button
                onClick={copyBarcode}
                className="text-[#22C55E] hover:text-[#22C55E]/80 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-2xl font-mono text-strong text-center py-2" dir="ltr">
              {memberData.barcode}
            </p>
          </div>

          {/* Subscription Info */}
          {memberData.activeSubscription && (
            <div className="bg-[#22C55E]/10 p-4 rounded-xl">
              <p className="text-sm text-soft mb-1">الاشتراك ينتهي</p>
              <p className="font-cairo font-bold text-[#22C55E]">
                {new Date(memberData.activeSubscription.endDate).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}

          {/* Self Check-in Button */}
          <button
            onClick={handleSelfCheckIn}
            disabled={scanning}
            className="w-full py-4 bg-[#22C55E] text-white rounded-xl font-cairo font-bold hover:bg-[#22C55E]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {scanning ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                جاري التسجيل...
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                تسجيل الحضور
              </>
            )}
          </button>

          {/* Attendance Message */}
          {attendanceMessage && (
            <div className={`p-4 rounded-xl flex items-center gap-2 ${
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

        {/* Instructions */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="font-cairo font-bold text-lg text-white mb-3">كيفية الاستخدام</h3>
          <ul className="space-y-2 text-sm text-muted-c">
            <li className="flex items-start gap-2">
              <span className="text-[#22C55E]">•</span>
              <span>اعرض الباركود الخاص بك عند دخول الجيم</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#22C55E]">•</span>
              <span>يمكنك نسخ الباركود ومشاركته مع الموظف</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#22C55E]">•</span>
              <span>اضغط على زر تسجيل الحضور للتسجيل الذاتي</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}