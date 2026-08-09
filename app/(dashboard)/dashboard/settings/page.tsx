'use client'

import { useState, useEffect } from 'react'
import { useGymStore } from '@/store/gym-store'
import { formatCurrency } from '@/lib/utils'
import { ADDONS } from '@/lib/addons'
import { PLANS } from '@/lib/billing'
import {
  Building2,
  CreditCard,
  Loader2,
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
  Check,
  X,
  Crown,
  Info,
  QrCode,
  RefreshCw,
  Download,
  Copy,
} from 'lucide-react'

interface GymDetails {
  id: string
  name: string
  slug: string
  phone: string | null
  city: string | null
  address: string | null
  status: string
  basePlanPrice: number
  billingCycle: string
  addons: string[]
  gymBarcode: string | null
  createdAt: string
}

interface GymPlan {
  id: string
  name: string
  duration: number
  price: number
}

// Pulled directly from billing.ts — single source of truth
const PLAN_LIST = [PLANS.starter, PLANS.pro] as const

// Feature comparison rows shown in the plan picker
const PLAN_COMPARISON = [
  {
    label: 'أعضاء وإشتراكات',
    starter: true,
    pro: true,
  },
  {
    label: 'المدفوعات',
    starter: true,
    pro: true,
  },
  {
    label: 'تقارير أساسية',
    starter: true,
    pro: true,
  },
  {
    label: 'فرع واحد',
    starter: true,
    pro: true,
  },
  {
    label: 'دعم فني',
    starter: true,
    pro: true,
  },
  {
    label: 'المصروفات والخزنة',
    starter: false,
    pro: true,
    addonPrice: ADDONS.expenses.price,
  },
  {
    label: 'الموظفون والصلاحيات',
    starter: false,
    pro: true,
    addonPrice: ADDONS.staff.price,
  },
  {
    label: 'المدربون',
    starter: false,
    pro: true,
    addonPrice: ADDONS.trainers.price,
  },
  {
    label: 'الكلاسات والحجوزات',
    starter: false,
    pro: true,
    addonPrice: ADDONS.classes.price,
  },
  {
    label: 'إدارة الفروع المتعددة',
    starter: false,
    pro: true,
    addonPrice: ADDONS.branches.price,
  },
  {
    label: 'تقارير متقدمة + تصدير Excel',
    starter: false,
    pro: true,
    addonPrice: ADDONS.advanced_reports.price,
  },
  {
    label: 'أولوية الدعم الفني',
    starter: false,
    pro: true,
  },
]

const ALL_ADDONS_PRICE = Object.values(ADDONS).reduce((s, a) => s + a.price, 0)

export default function SettingsPage() {
  const { gym } = useGymStore()
  const gymSlug = gym?.slug

  const [gymData, setGymData] = useState<GymDetails | null>(null)
  const [plans, setPlans] = useState<GymPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({ name: '', phone: '', city: '', address: '', gymBarcode: '' })
  const [regeneratingBarcode, setRegeneratingBarcode] = useState(false)
  const [barcodeMessage, setBarcodeMessage] = useState('')

  // Plan form
  const [planForm, setPlanForm] = useState({ name: '', duration: '30', price: '300' })
  const [planSaving, setPlanSaving] = useState(false)

  useEffect(() => {
    if (!gymSlug) return
    fetch(`/api/gyms/${gymSlug}`)
      .then((r) => r.json())
      .then((data) => {
        setGymData(data.gym)
        setPlans(data.plans)
        setForm({
          name: data.gym.name || '',
          phone: data.gym.phone || '',
          city: data.gym.city || '',
          address: data.gym.address || '',
          gymBarcode: data.gym.gymBarcode || '',
        })
        setSelectedPrice(data.gym.basePlanPrice || PLANS.starter.price)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [gymSlug])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gymSlug) return
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch(`/api/gyms/${gymSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ')
      setGymData((prev) =>
        prev ? { ...prev, name: form.name, phone: form.phone, city: form.city, address: form.address, gymBarcode: form.gymBarcode } : prev
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  const handleRegenerateBarcode = async () => {
    if (!gymSlug) return
    setRegeneratingBarcode(true)
    setBarcodeMessage('')
    try {
      const res = await fetch(`/api/gyms/${gymSlug}/barcode`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل توليد الباركود')
      
      setGymData((prev) => prev ? { ...prev, gymBarcode: data.gym.gymBarcode } : prev)
      setForm((prev) => ({ ...prev, gymBarcode: data.gym.gymBarcode }))
      setBarcodeMessage('تم توليد باركود جديد بنجاح')
      setTimeout(() => setBarcodeMessage(''), 3000)
    } catch (err) {
      setBarcodeMessage(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setRegeneratingBarcode(false)
    }
  }

  const handlePrintBarcode = () => {
    if (!gymData?.gymBarcode || !gymData?.slug) return
    
    const attendanceUrl = `${window.location.origin}/attendance/${encodeURIComponent(gymData.slug)}`
    
    // Create a simple print window with the barcode and QR code
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>باركود الجيم - ${gymData.name}</title>
          <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .barcode-container {
              border: 2px solid #22C55E;
              padding: 40px;
              border-radius: 10px;
              text-align: center;
              max-width: 400px;
            }
            .gym-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 20px;
              color: #333;
            }
            .barcode-label {
              font-size: 16px;
              margin-bottom: 10px;
              color: #666;
            }
            .barcode {
              font-size: 32px;
              font-family: monospace;
              font-weight: bold;
              color: #22C55E;
              letter-spacing: 2px;
              margin: 20px 0;
            }
            .qr-section {
              margin: 30px 0;
              padding: 20px;
              background: #f0f0f0;
              border-radius: 10px;
            }
            .qr-label {
              font-size: 14px;
              margin-bottom: 10px;
              color: #666;
            }
            #qrcode {
              display: flex;
              justify-content: center;
              margin: 10px 0;
            }
            #qrcode img {
              max-width: 200px;
              height: auto;
            }
            .instructions {
              font-size: 14px;
              color: #888;
              margin-top: 20px;
            }
            .instructions-highlight {
              font-size: 16px;
              font-weight: bold;
              color: #22C55E;
              margin-top: 10px;
            }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <div class="gym-name">${gymData.name}</div>
            <div class="barcode-label">باركود الجيم</div>
            <div class="barcode">${gymData.gymBarcode}</div>
            
            <div class="qr-section">
              <div class="qr-label">أو امسح هذا الكود</div>
              <div id="qrcode"></div>
            </div>
            
            <div class="instructions">
              امسح الباركود أو الكود لتسجيل الحضور
            </div>
            <div class="instructions-highlight">
              سيعمل من أي تطبيق ماسح على هاتفك
            </div>
          </div>
          <script>
            // Generate QR code
            const qrUrl = "${attendanceUrl}";
            QRCode.toCanvas(document.createElement('canvas'), qrUrl, { 
              width: 200,
              margin: 2,
              color: {
                dark: '#22C55E',
                light: '#ffffff'
              }
            }, function(error, canvas) {
              if (error) {
                console.error(error);
                return;
              }
              document.getElementById('qrcode').appendChild(canvas);
            });
            
            window.print();
          </script>
        </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const handleCopyAttendanceUrl = () => {
    if (!gymData?.slug) return
    const attendanceUrl = `${window.location.origin}/attendance/${encodeURIComponent(gymData.slug)}`
    navigator.clipboard.writeText(attendanceUrl)
    setBarcodeMessage('تم نسخ رابط الحضور')
    setTimeout(() => setBarcodeMessage(''), 3000)
  }

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gymSlug) return
    setPlanSaving(true)
    try {
      const res = await fetch(`/api/gyms/${gymSlug}/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planForm.name,
          duration: parseInt(planForm.duration),
          price: parseFloat(planForm.price),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل إضافة الخطة')
      setPlans([...plans, data.plan])
      setPlanForm({ name: '', duration: '30', price: '300' })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setPlanSaving(false)
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (!gymSlug) return
    if (!confirm('متأكد من حذف هذه الخطة؟')) return
    try {
      const res = await fetch(`/api/gyms/${gymSlug}/plans/${planId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('فشل الحذف')
      setPlans(plans.filter((p) => p.id !== planId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ')
    }
  }

  // Plan picker state
  const [selectedPrice, setSelectedPrice] = useState<number>(PLANS.starter.price)
  const [planSaveLoading, setPlanSaveLoading] = useState(false)
  const [planError, setPlanError] = useState('')
  const [planSaved, setPlanSaved] = useState(false)

  const selectedPlan = PLAN_LIST.find((p) => p.price === selectedPrice) ?? PLANS.starter
  const isPro = selectedPlan.key === 'pro'
  const isTrial = gymData?.status === 'trial'
  const currentPlan = PLAN_LIST.find((p) => p.price === (gymData?.basePlanPrice ?? 0))

  const handlePlanSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gymSlug) return
    setPlanSaveLoading(true)
    setPlanError('')
    setPlanSaved(false)
    try {
      const res = await fetch(`/api/gyms/${gymSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // For Pro: API will auto-assign all addons. For Starter: API clears addons.
        body: JSON.stringify({ basePlanPrice: selectedPrice }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ')
      setGymData((prev) =>
        prev ? { ...prev, basePlanPrice: selectedPrice } : prev
      )
      setPlanSaved(true)
      setTimeout(() => setPlanSaved(false), 3000)
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setPlanSaveLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#22C55E]" />
      </div>
    )
  }

  const inputClass =
    'w-full bg-app border border-app rounded-xl py-3 px-4 text-strong focus:outline-none focus:border-[#22C55E]/50 focus:ring-2 focus:ring-[#22C55E]/20'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="font-cairo font-bold text-2xl">الإعدادات</h2>
        <p className="text-sm text-muted-c">إدارة بيانات جيمك وحسابك</p>
      </div>

      {/* ── Gym Info ─────────────────────────────────────────────── */}
      <form onSubmit={handleSave} className="glass-card p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#22C55E]" />
          </div>
          <h3 className="font-cairo font-bold text-lg">بيانات الجيم</h3>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        {saved && (
          <div className="p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            تم الحفظ بنجاح
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2 text-soft">اسم الجيم</label>
          <input type="text" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-soft">التليفون</label>
            <input type="tel" dir="ltr" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={`${inputClass} text-left`} placeholder="01012345678" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-soft">المدينة</label>
            <input type="text" value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className={inputClass} placeholder="القاهرة" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-soft">العنوان</label>
          <input type="text" value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className={inputClass} placeholder="العنوان التفصيلي" />
        </div>
        
        {/* Gym Barcode Display */}
        {gymData?.gymBarcode && (
          <div className="bg-[#22C55E]/10 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-soft">باركود الجيم (للتسجيل)</span>
              <QrCode className="w-4 h-4 text-[#22C55E]" />
            </div>
            <p className="text-2xl font-mono text-strong text-center py-2" dir="ltr">
              {gymData.gymBarcode}
            </p>
            <p className="text-xs text-muted-c text-center mt-2 mb-4">
              اطبع هذا الباركود وضعه في مدخل الجيم للاستخدام في تسجيل الحضور
            </p>
            

            
            <div className="flex gap-2">
              <button
                onClick={handleRegenerateBarcode}
                disabled={regeneratingBarcode}
                className="flex-1 py-2 bg-app border border-app text-white rounded-xl text-sm font-medium hover:surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {regeneratingBarcode ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري التوليد...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    توليد جديد
                  </>
                )}
              </button>
              <button
                onClick={handlePrintBarcode}
                className="flex-1 py-2 bg-[#22C55E] text-white rounded-xl text-sm font-medium hover:bg-[#22C55E]/90 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                طباعة
              </button>
            </div>
            {barcodeMessage && (
              <div className={`mt-3 text-center text-sm ${
                barcodeMessage.includes('نجاح') || barcodeMessage.includes('نسخ') ? 'text-[#22C55E]' : 'text-red-400'
              }`}>
                {barcodeMessage}
              </div>
            )}
          </div>
        )}
        
        <button type="submit" disabled={saving}
          className="w-full py-3 bg-[#22C55E] text-white rounded-xl font-semibold hover:bg-[#16A34A] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <><Loader2 className="w-5 h-5 animate-spin" />جاري الحفظ...</> : 'حفظ التغييرات'}
        </button>
      </form>

      {/* ── Subscription Plans (gym's own plans for members) ───── */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-[#22C55E]" />
          </div>
          <div>
            <h3 className="font-cairo font-bold text-lg">خطط الاشتراك</h3>
            <p className="text-xs text-faint">الخطط اللي بتقدّمها لأعضاء جيمك</p>
          </div>
        </div>

        <div className="space-y-2">
          {plans.length === 0 ? (
            <p className="text-sm text-faint">مفيش خطط بعد</p>
          ) : (
            plans.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between p-3 surface rounded-xl">
                <div>
                  <div className="font-medium text-sm">{plan.name}</div>
                  <div className="text-xs text-faint">{plan.duration} يوم — {formatCurrency(plan.price)}</div>
                </div>
                <button onClick={() => handleDeletePlan(plan.id)}
                  className="p-1.5 text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAddPlan} className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-app">
          <input type="text" required placeholder="اسم الخطة" value={planForm.name}
            onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
            className={`${inputClass} py-2.5 text-sm`} />
          <input type="number" required min="1" dir="ltr" placeholder="المدة (يوم)" value={planForm.duration}
            onChange={(e) => setPlanForm({ ...planForm, duration: e.target.value })}
            className={`${inputClass} py-2.5 text-sm text-left`} />
          <input type="number" required min="0" dir="ltr" placeholder="السعر" value={planForm.price}
            onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
            className={`${inputClass} py-2.5 text-sm text-left`} />
          <button type="submit" disabled={planSaving}
            className="bg-[#22C55E]/10 text-[#22C55E] rounded-xl py-2.5 text-sm font-semibold hover:bg-[#22C55E]/20 transition-colors flex items-center justify-center gap-1 disabled:opacity-50">
            {planSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            إضافة
          </button>
        </form>
      </div>

      {/* ── Platform Plan Picker ─────────────────────────────────── */}
      <form onSubmit={handlePlanSave} className="glass-card p-6 rounded-2xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#22C55E]" />
          </div>
          <div>
            <h3 className="font-cairo font-bold text-lg">باقة OpenGym</h3>
            <p className="text-xs text-faint">
              {isTrial
                ? 'اختار الباقة المناسبة — كل المميزات مفتوحة للتجربة'
                : 'لتغيير الباقة تواصل معنا مباشرة'}
            </p>
          </div>
        </div>

        {/* Non-trial locked notice */}
        {!isTrial && (
          <div className="p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-sm text-[#F59E0B] flex items-start gap-3">
            <span className="text-lg leading-none mt-0.5">🔒</span>
            <div>
              <p className="font-semibold mb-1">التغيير يتم بالتنسيق معنا</p>
              <p className="text-xs text-[#F59E0B]/80">
                تواصل على{' '}
                <span className="font-bold" dir="ltr">01558282760</span>
                {' '}(انستاباي / فودافون كاش)
              </p>
            </div>
          </div>
        )}

        {planError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {planError}
          </div>
        )}
        {planSaved && (
          <div className="p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            تم تحديث الباقة بنجاح
          </div>
        )}

        {/* ── Plan cards ── */}
        <div className={`grid sm:grid-cols-2 gap-4 ${!isTrial ? 'opacity-50 pointer-events-none' : ''}`}>
          {PLAN_LIST.map((plan) => {
            const isSelected = selectedPrice === plan.price
            const isCurrent = currentPlan?.key === plan.key

            return (
              <button
                type="button"
                key={plan.key}
                onClick={() => setSelectedPrice(plan.price)}
                className={`relative p-5 rounded-2xl border-2 text-right transition-all ${
                  isSelected
                    ? 'border-[#22C55E] bg-[#22C55E]/5'
                    : 'border-app hover:border-[#22C55E]/30'
                }`}
              >
                {/* Popular badge */}
                {plan.key === 'pro' && (
                  <div className="absolute -top-3 right-4 flex items-center gap-1 px-3 py-1 bg-[#22C55E] rounded-full text-xs font-bold text-white">
                    <Crown className="w-3 h-3" />
                    الأفضل
                  </div>
                )}

                {/* Current plan badge */}
                {isCurrent && !isTrial && (
                  <div className="absolute -top-3 left-4 px-3 py-1 bg-[#3B82F6] rounded-full text-xs font-bold text-white">
                    باقتك الحالية
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-cairo font-bold text-xl mb-0.5">{plan.name}</div>
                    <div className="text-xs text-muted-c leading-relaxed">{plan.description}</div>
                  </div>
                  {/* Selection indicator */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                    isSelected ? 'border-[#22C55E] bg-[#22C55E]' : 'border-app'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-3xl font-black font-cairo text-strong">
                    {plan.price.toLocaleString('ar-EG')}
                  </span>
                  <span className="text-sm text-faint mb-1">ج / شهر</span>
                </div>

                {/* What's different highlight */}
                {plan.key === 'pro' ? (
                  <div className="p-2.5 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 text-xs text-[#4ADE80] font-medium text-center">
                    يشمل كل الإضافات — بدون رسوم إضافية
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-app border border-app text-xs text-faint text-center">
                    الإضافات اختيارية بسعر منفصل
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Feature comparison table ── */}
        <div className={!isTrial ? 'opacity-50' : ''}>
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-faint" />
            <span className="text-sm font-medium text-soft">مقارنة الباقات</span>
          </div>

          <div className="rounded-2xl border border-app overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-3 bg-app/60 px-4 py-2.5 border-b border-app text-xs font-bold text-center">
              <div className="text-right text-faint">الميزة</div>
              <div className="text-[#94A3B8]">Starter<br /><span className="font-normal text-[10px]">{PLANS.starter.price.toLocaleString('ar-EG')} ج/شهر</span></div>
              <div className="text-[#22C55E]">Pro<br /><span className="font-normal text-[10px]">{PLANS.pro.price.toLocaleString('ar-EG')} ج/شهر</span></div>
            </div>

            {PLAN_COMPARISON.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-3 px-4 py-2.5 items-center text-sm ${
                  i % 2 === 0 ? '' : 'bg-white/[0.02]'
                } ${i < PLAN_COMPARISON.length - 1 ? 'border-b border-app/50' : ''}`}
              >
                {/* Feature name */}
                <div className="flex items-center gap-2">
                  <span className="text-soft">{row.label}</span>
                  {row.addonPrice && !row.starter && (
                    <span className="text-[10px] text-faint bg-app px-1.5 py-0.5 rounded-md border border-app whitespace-nowrap">
                      +{row.addonPrice} ج
                    </span>
                  )}
                </div>

                {/* Starter */}
                <div className="flex items-center justify-center">
                  {row.starter ? (
                    <Check className="w-4 h-4 text-[#22C55E]" />
                  ) : (
                    <div className="flex flex-col items-center gap-0.5">
                      <X className="w-4 h-4 text-faint" />
                      {row.addonPrice && (
                        <span className="text-[9px] text-faint">إضافة</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Pro */}
                <div className="flex items-center justify-center">
                  <Check className="w-4 h-4 text-[#22C55E]" />
                </div>
              </div>
            ))}
          </div>

          {/* Addons saving note for Pro */}
          <div className="mt-3 p-3 rounded-xl bg-[#22C55E]/5 border border-[#22C55E]/20">
            <p className="text-xs text-[#4ADE80] text-center">
              باقة Pro بتوفر عليك{' '}
              <span className="font-bold">
                {(PLANS.starter.price + ALL_ADDONS_PRICE - PLANS.pro.price).toLocaleString('ar-EG')} ج/شهر
              </span>{' '}
              مقارنةً بـ Starter + كل الإضافات (
              {(PLANS.starter.price + ALL_ADDONS_PRICE).toLocaleString('ar-EG')} ج)
            </p>
          </div>
        </div>

        {/* Payment note */}
        <div className="p-3 rounded-xl border border-app">
          <p className="text-xs text-muted-c">
            للدفع أو تغيير الباقة، تواصل معنا على:{' '}
            <span className="font-bold text-[#22C55E]" dir="ltr">01558282760</span>
            {' '}(انستاباي / فودافون كاش)
          </p>
        </div>

        <button
          type="submit"
          disabled={planSaveLoading || !isTrial || selectedPrice === gymData?.basePlanPrice}
          className="w-full py-3.5 bg-[#22C55E] text-white rounded-xl font-semibold hover:bg-[#16A34A] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {planSaveLoading ? (
            <><Loader2 className="w-5 h-5 animate-spin" />جاري الحفظ...</>
          ) : !isTrial ? (
            'التواصل مطلوب لتغيير الباقة'
          ) : selectedPrice === gymData?.basePlanPrice ? (
            'هذه باقتك الحالية'
          ) : (
            `حفظ — التحويل لباقة ${selectedPlan.name}`
          )}
        </button>
      </form>
    </div>
  )
}
