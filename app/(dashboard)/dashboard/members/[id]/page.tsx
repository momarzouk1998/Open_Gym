'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useGymStore } from '@/store/gym-store'
import { formatDate, formatCurrency, whatsappUrl } from '@/lib/utils'
import {
  ArrowRight,
  Phone,
  User,
  Calendar,
  CreditCard,
  Wallet,
  MessageCircle,
  Plus,
  Loader2,
  Users,
  Dumbbell,
  MapPin,
  QrCode,
  Copy,
  Check,
  Lock,
  RefreshCw,
} from 'lucide-react'

interface Subscription {
  id: string
  startDate: string
  endDate: string
  price: number
  discount: number
  finalPrice: number
  status: string
  plan: { id: string; name: string }
}

interface Payment {
  id: string
  amount: number
  finalAmount: number
  method: string
  status: string
  paidAt: string
}

interface MemberDetail {
  id: string
  memberNumber: string | null
  barcode: string | null
  fullName: string
  phone: string | null
  email?: string | null
  gender: string | null
  address: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  trainer: { id: string; fullName: string } | null
  subscriptions: Subscription[]
  payments: Payment[]
}

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'فعّال', color: 'text-[#22C55E] bg-[#22C55E]/10' },
  expired: { label: 'منتهي', color: 'text-[#EF4444] bg-[#EF4444]/10' },
  frozen: { label: 'مجمّد', color: 'text-[#3B82F6] bg-[#3B82F6]/10' },
  cancelled: { label: 'ملغي', color: 'text-[#64748B] bg-[#64748B]/10' },
}

const methodLabels: Record<string, string> = {
  cash: 'كاش',
  instapay: 'إنستاباي',
  vodafone_cash: 'فودافون كاش',
  bank_transfer: 'تحويل بنكي',
  other: 'أخرى',
}

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { gym, initialized } = useGymStore()
  const gymSlug = gym?.slug

  const [member, setMember] = useState<MemberDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')

  useEffect(() => {
    if (!initialized || !gymSlug) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/gyms/${gymSlug}/members/${params.id}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'فشل تحميل بيانات العضو')
        }
        const data = await res.json()
        if (!cancelled) setMember(data.member)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'حدث خطأ')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [initialized, gymSlug, params.id])

  // Loading state
  if (loading && !member) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#22C55E]" />
      </div>
    )
  }

  // Error state
  if (error && !member) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/members"
          className="inline-flex items-center gap-2 text-sm text-muted-c hover:text-strong transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          رجوع للأعضاء
        </Link>
        <div className="glass-card rounded-2xl p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-[#EF4444]/30" />
          <h3 className="font-cairo font-bold text-lg mb-2">مفيش عضو بده الرقم</h3>
          <p className="text-muted-c text-sm mb-6">{error}</p>
          <Link
            href="/dashboard/members"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#22C55E] text-white rounded-xl text-sm font-semibold hover:bg-[#16A34A] transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            الرجوع لقائمة الأعضاء
          </Link>
        </div>
      </div>
    )
  }

  if (!member) return null

  const currentSub = member.subscriptions[0]
  const totalPaid = member.payments.reduce((sum, p) => sum + p.finalAmount, 0)
  const whatsappLink = whatsappUrl(
    member.phone,
    `أهلاً ${member.fullName} 👋`
  )

  const getStatusInfo = (status: string) =>
    statusConfig[status] || { label: status, color: 'text-faint bg-[#64748B]/10' }

  const copyBarcode = () => {
    if (member?.barcode) {
      navigator.clipboard.writeText(member.barcode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleResetPassword = async () => {
    if (!gymSlug || !member) return
    if (!confirm('هل أنت متأكد من إعادة تعيين كلمة المرور لهذا العضو؟')) return
    
    setResettingPassword(true)
    setPasswordMessage('')
    
    try {
      const res = await fetch(`/api/gyms/${gymSlug}/members/${member.id}/reset-password`, {
        method: 'POST',
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل إعادة تعيين كلمة المرور')
      
      setPasswordMessage('تم إعادة تعيين كلمة المرور إلى 123456')
      setTimeout(() => setPasswordMessage(''), 3000)
    } catch (err) {
      setPasswordMessage(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setResettingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/members"
        className="inline-flex items-center gap-2 text-sm text-muted-c hover:text-strong transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        رجوع للأعضاء
      </Link>

      {/* Member header card */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#22C55E] to-[#16A34A] flex items-center justify-center text-white font-bold text-2xl font-cairo flex-shrink-0">
              {member.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h2 className="font-cairo font-bold text-2xl">{member.fullName}</h2>
                <span
                  className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                    member.isActive
                      ? 'text-[#22C55E] bg-[#22C55E]/10'
                      : 'text-[#EF4444] bg-[#EF4444]/10'
                  }`}
                >
                  {member.isActive ? 'نشط' : 'محذوف'}
                </span>
              </div>
              {member.memberNumber && (
                <div className="text-sm text-faint font-mono" dir="ltr">
                  {member.memberNumber}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border border-app rounded-xl text-sm font-medium hover:surface transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#22C55E]" />
                واتساب
              </a>
            )}
            <button
              onClick={handleResetPassword}
              disabled={resettingPassword}
              className="inline-flex items-center gap-2 px-4 py-2 border border-app rounded-xl text-sm font-medium hover:surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resettingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 text-[#22C55E]" />
                  إعادة كلمة المرور
                </>
              )}
            </button>
            <button
              onClick={() =>
                router.push(`/dashboard/subscriptions?member=${member.id}`)
              }
              className="inline-flex items-center gap-2 px-4 py-2 border border-app rounded-xl text-sm font-medium hover:surface transition-colors"
            >
              <Plus className="w-4 h-4 text-[#22C55E]" />
              اشتراك جديد
            </button>
          </div>
          
          {passwordMessage && (
            <div className={`mt-2 text-sm ${
              passwordMessage.includes('نجاح') ? 'text-[#22C55E]' : 'text-red-400'
            }`}>
              {passwordMessage}
            </div>
          )}
        </div>

        {/* Quick info grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-app">
          {member.barcode && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
                <QrCode className="w-4 h-4 text-[#22C55E]" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-faint">الباركود</div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-mono font-medium truncate" dir="ltr">
                    {member.barcode}
                  </span>
                  <button
                    onClick={copyBarcode}
                    className="text-[#22C55E] hover:text-[#22C55E]/80 transition-colors flex-shrink-0"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          )}
          {member.phone && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
                <Phone className="w-4 h-4 text-[#22C55E]" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-faint">التليفون</div>
                <a
                  href={`tel:${member.phone}`}
                  className="text-sm font-medium hover:text-[#22C55E] transition-colors truncate block"
                  dir="ltr"
                >
                  {member.phone}
                </a>
              </div>
            </div>
          )}
          {member.email && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
                <User className="w-4 h-4 text-[#22C55E]" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-faint">البريد الإلكتروني</div>
                <span className="text-sm font-medium truncate block" dir="ltr">
                  {member.email}
                </span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
              <User className="w-4 h-4 text-[#22C55E]" />
            </div>
            <div>
              <div className="text-xs text-faint">النوع</div>
              <div className="text-sm font-medium">
                {member.gender === 'male'
                  ? 'ذكر'
                  : member.gender === 'female'
                  ? 'أنثى'
                  : '—'}
              </div>
            </div>
          </div>
          {member.trainer && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-[#22C55E]" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-faint">المدرب</div>
                <div className="text-sm font-medium truncate">
                  {member.trainer.fullName}
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-[#22C55E]" />
            </div>
            <div>
              <div className="text-xs text-faint">عضو منذ</div>
              <div className="text-sm font-medium">
                {formatDate(member.createdAt)}
              </div>
            </div>
          </div>
        </div>

        {member.address && (
          <div className="flex items-center gap-2 mt-4 text-sm text-muted-c">
            <MapPin className="w-4 h-4 text-faint" />
            {member.address}
          </div>
        )}

        {member.notes && (
          <div className="mt-4 p-3 surface rounded-xl text-sm text-muted-c">
            <span className="text-faint">ملاحظات: </span>
            {member.notes}
          </div>
        )}
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#22C55E]" />
            </div>
          </div>
          <div className="text-2xl font-bold font-cairo">
            {member.subscriptions.length}
          </div>
          <div className="text-sm text-muted-c">إجمالي الاشتراكات</div>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#4ADE80]/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#4ADE80]" />
            </div>
          </div>
          <div className="text-2xl font-bold font-cairo">
            {formatCurrency(totalPaid)}
          </div>
          <div className="text-sm text-muted-c">إجمالي المدفوع</div>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#3B82F6]" />
            </div>
          </div>
          <div className="text-2xl font-bold font-cairo">
            {currentSub ? formatDate(currentSub.endDate) : '—'}
          </div>
          <div className="text-sm text-muted-c">انتهاء الاشتراك الحالي</div>
        </div>
      </div>

      {/* Subscriptions history */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-app">
          <h3 className="font-cairo font-bold text-lg">سجل الاشتراكات</h3>
        </div>
        {member.subscriptions.length === 0 ? (
          <div className="p-12 text-center text-faint">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">مفيش اشتراكات سابقة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="surface text-sm text-faint">
                <tr>
                  <th className="p-4 font-medium">الباقة</th>
                  <th className="p-4 font-medium">تاريخ البداية</th>
                  <th className="p-4 font-medium">تاريخ النهاية</th>
                  <th className="p-4 font-medium">المبلغ</th>
                  <th className="p-4 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {member.subscriptions.map((sub) => {
                  const st = getStatusInfo(sub.status)
                  return (
                    <tr
                      key={sub.id}
                      className="border-t border-app hover:surface transition-colors"
                    >
                      <td className="p-4 font-medium">{sub.plan.name}</td>
                      <td className="p-4 text-sm text-muted-c">
                        {formatDate(sub.startDate)}
                      </td>
                      <td className="p-4 text-sm text-muted-c">
                        {formatDate(sub.endDate)}
                      </td>
                      <td className="p-4 text-sm font-medium">
                        {formatCurrency(sub.finalPrice)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${st.color}`}
                        >
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payments history */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-app">
          <h3 className="font-cairo font-bold text-lg">سجل المدفوعات</h3>
        </div>
        {member.payments.length === 0 ? (
          <div className="p-12 text-center text-faint">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">مفيش مدفوعات مسجّلة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="surface text-sm text-faint">
                <tr>
                  <th className="p-4 font-medium">التاريخ</th>
                  <th className="p-4 font-medium">المبلغ</th>
                  <th className="p-4 font-medium">طريقة الدفع</th>
                  <th className="p-4 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {member.payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-t border-app hover:surface transition-colors"
                  >
                    <td className="p-4 text-sm text-muted-c">
                      {formatDate(payment.paidAt)}
                    </td>
                    <td className="p-4 text-sm font-medium">
                      {formatCurrency(payment.finalAmount)}
                    </td>
                    <td className="p-4 text-sm text-muted-c">
                      {methodLabels[payment.method] || payment.method}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'paid'
                            ? 'text-[#22C55E] bg-[#22C55E]/10'
                            : 'text-[#F59E0B] bg-[#F59E0B]/10'
                        }`}
                      >
                        {payment.status === 'paid'
                          ? 'مدفوع'
                          : payment.status === 'pending'
                          ? 'معلّق'
                          : payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
