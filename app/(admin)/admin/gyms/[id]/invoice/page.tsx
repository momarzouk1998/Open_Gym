'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ADDONS } from '@/lib/addons'
import { getPlanByPrice, PLANS as BILLING_PLANS } from '@/lib/billing'
import { Printer, ArrowRight, Building2, CheckCircle2, ShieldCheck, Download, Loader2 } from 'lucide-react'

interface AdminGym {
  id: string
  name: string
  slug: string
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  phone: string | null
  city: string | null
  address: string | null
  status: string
  basePlanPrice: number
  addons: string[]
  billingCycle: string
  nextBillingDate: string | null
  lastPaidAt: string | null
  createdAt: string
}

export default function GymInvoicePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const gymId = params.id

  const [gym, setGym] = useState<AdminGym | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!gymId) return
    fetch(`/api/admin/gyms/${gymId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.gym) {
          setGym(data.gym)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [gymId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-[#22C55E]" />
      </div>
    )
  }

  if (!gym) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-muted-c">
        <p>الجيم غير موجود</p>
      </div>
    )
  }

  const selectedPlanKey = getPlanByPrice(gym.basePlanPrice)
  const planName = selectedPlanKey === 'pro' ? 'الباقة الإحترافية (Pro)' : 'الباقة الأساسية (Starter)'
  const proSelected = selectedPlanKey === 'pro'
  const addonsTotal = proSelected
    ? 0
    : (gym.addons || []).reduce((sum, key) => sum + (ADDONS[key as keyof typeof ADDONS]?.price ?? 0), 0)
  const grandTotal = gym.basePlanPrice + addonsTotal

  const invoiceNumber = `INV-${gym.id.slice(0, 8).toUpperCase()}`
  const invoiceDate = gym.lastPaidAt ? formatDate(gym.lastPaidAt) : formatDate(new Date().toISOString())

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-8 print:p-0 print:bg-white print:text-black">
      {/* Top Bar for Actions (Hidden during print) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={() => router.push(`/admin/gyms/${gymId}`)}
          className="flex items-center gap-2 text-sm text-muted-c hover:text-white transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للوحة الجيم
        </button>

        <button
          onClick={handlePrint}
          className="px-5 py-2.5 bg-[#22C55E] text-white rounded-xl font-cairo font-bold hover:bg-[#16A34A] transition-colors flex items-center gap-2 shadow-lg shadow-[#22C55E]/20"
        >
          <Printer className="w-5 h-5" />
          طباعة الفاتورة (PDF)
        </button>
      </div>

      {/* Invoice Card (Designed for Screen & Print) */}
      <div className="max-w-3xl mx-auto bg-[#141414] border border-[#22C55E]/20 p-8 rounded-2xl print:border-none print:shadow-none print:bg-white print:text-black font-cairo">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 print:border-black/10 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E] print:border-black print:text-black">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-2xl tracking-wide text-white print:text-black">OpenGym</h1>
              <p className="text-xs text-muted-c print:text-gray-600">منصة إدارة الأندية والصالات الرياضية</p>
            </div>
          </div>

          <div className="text-left" dir="ltr">
            <span className="inline-block px-3 py-1 bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-xs font-bold rounded-full mb-1 print:bg-gray-100 print:text-black">
              PAID / مدفوعة
            </span>
            <div className="text-xs text-muted-c print:text-gray-600">رقم الفاتورة: {invoiceNumber}</div>
            <div className="text-xs text-muted-c print:text-gray-600">تاريخ الإصدار: {invoiceDate}</div>
          </div>
        </div>

        {/* Bill To & Details Grid */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8 bg-white/5 print:bg-gray-50 p-4 rounded-xl border border-white/5 print:border-gray-200">
          <div>
            <span className="text-xs text-[#22C55E] font-bold block mb-1 print:text-black">صادرة إلى (بيانات الجيم):</span>
            <div className="font-bold text-base text-white print:text-black">{gym.name}</div>
            <div className="text-xs text-muted-c print:text-gray-700">المالك: {gym.ownerName}</div>
            <div className="text-xs text-muted-c print:text-gray-700">تليفون: <span dir="ltr">{gym.ownerPhone}</span></div>
            <div className="text-xs text-muted-c print:text-gray-700">البريد: <span dir="ltr">{gym.ownerEmail}</span></div>
            {gym.city && <div className="text-xs text-muted-c print:text-gray-700">المدينة: {gym.city}</div>}
          </div>

          <div>
            <span className="text-xs text-[#22C55E] font-bold block mb-1 print:text-black">تفاصيل الاشتراك:</span>
            <div className="text-xs text-muted-c print:text-gray-700 mb-1">
              دورة الفاتورة: <strong className="text-white print:text-black">{gym.billingCycle === 'annual' ? 'سنوي' : 'شهري'}</strong>
            </div>
            <div className="text-xs text-muted-c print:text-gray-700 mb-1">
              تاريخ التسجيل: <strong className="text-white print:text-black">{formatDate(gym.createdAt)}</strong>
            </div>
            {gym.nextBillingDate && (
              <div className="text-xs text-muted-c print:text-gray-700">
                الاستحقاق القادم: <strong className="text-white print:text-black">{formatDate(gym.nextBillingDate)}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-white/10 print:border-gray-300 text-muted-c print:text-gray-700">
                <th className="py-3 px-2">البند / الخدمة</th>
                <th className="py-3 px-2">النوع</th>
                <th className="py-3 px-2 text-left">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 print:divide-gray-200">
              <tr>
                <td className="py-3 px-2">
                  <div className="font-bold text-white print:text-black">{planName}</div>
                  <div className="text-xs text-muted-c print:text-gray-600">اشتراك منصة OpenGym لإدارة الجيم</div>
                </td>
                <td className="py-3 px-2 text-xs text-muted-c print:text-gray-600">باقة أساسية</td>
                <td className="py-3 px-2 text-left font-bold text-white print:text-black">
                  {formatCurrency(gym.basePlanPrice)}
                </td>
              </tr>

              {!proSelected && (gym.addons || []).map((addonKey) => {
                const addon = ADDONS[addonKey as keyof typeof ADDONS]
                if (!addon) return null
                return (
                  <tr key={addonKey}>
                    <td className="py-3 px-2">
                      <div className="font-bold text-white print:text-black">{addon.name}</div>
                      <div className="text-xs text-muted-c print:text-gray-600">{addon.description}</div>
                    </td>
                    <td className="py-3 px-2 text-xs text-muted-c print:text-gray-600">إضافة جديدة</td>
                    <td className="py-3 px-2 text-left font-bold text-white print:text-black">
                      +{addon.price} ج
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Total Summary Box */}
        <div className="bg-[#1f1f1f] print:bg-gray-100 p-4 rounded-xl flex items-center justify-between border border-white/10 print:border-gray-300 mb-8">
          <div>
            <div className="text-xs text-muted-c print:text-gray-600">المبلغ الإجمالي المترتب:</div>
            <div className="text-xs text-[#22C55E] font-bold print:text-black">خالصة ومسددة بالكامل</div>
          </div>
          <div className="text-2xl font-bold text-[#22C55E] print:text-black">
            {formatCurrency(grandTotal)}
          </div>
        </div>

        {/* Footer / Stamp */}
        <div className="flex items-center justify-between border-t border-white/10 print:border-gray-300 pt-6 text-xs text-muted-c print:text-gray-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#22C55E] print:text-black" />
            <span>فاتورة إلكترونية معتمدة تلقائياً من نظام OpenGym</span>
          </div>
          <div>شكراً لثقتكم بنا! 🚀</div>
        </div>
      </div>
    </div>
  )
}
