'use client'

import { useApi } from '@/hooks/useApi'
import { formatCurrency, exportToCsv } from '@/lib/utils'
import { useGymStore } from '@/store/gym-store'
import { DashboardChartSkeleton } from '@/components/ui/Skeleton'
import {
  BarChart3,
  TrendingUp,
  Users,
  CreditCard,
  Loader2,
  Wallet,
  Download,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

interface ReportsData {
  revenueChart: { month: string; revenue: number; label: string }[]
  revenueByMethod: { method: string; total: number; count: number }[]
  memberGrowth: { month: string; newMembers: number; label: string }[]
  subscriptionsByStatus: { status: string; count: number }[]
  totals: {
    allTimeRevenue: number
    totalMembers: number
    activeSubs: number
  }
}

const methodLabels: Record<string, string> = {
  cash: 'كاش',
  instapay: 'انستاباي',
  vodafone_cash: 'فودافون كاش',
  bank_transfer: 'تحويل بنكي',
  other: 'أخرى',
}

const statusLabels: Record<string, string> = {
  active: 'فعّال',
  trial: 'تجريبي',
  suspended: 'موقوف',
  cancelled: 'ملغي',
  expired: 'منتهي',
}

const PIE_COLORS = ['#22C55E', '#4ADE80', '#3B82F6', '#F59E0B', '#EF4444', '#64748B']

export default function ReportsPage() {
  const { data, loading, error } = useApi<ReportsData>('/reports')
  const { gym } = useGymStore()

  const handleExport = () => {
    if (!data) return
    const gymName = gym?.name || 'gym'
    const date = new Date().toISOString().slice(0, 10)

    // Sheet 1: Revenue by month
    exportToCsv(
      data.revenueChart.map((r) => ({ الشهر: r.label, 'الإيرادات (ج)': r.revenue })),
      `${gymName}-الإيرادات-${date}`
    )

    // Sheet 2: Revenue by payment method (separate file)
    const methodLabelsMap: Record<string, string> = {
      cash: 'كاش', instapay: 'انستاباي', vodafone_cash: 'فودافون كاش',
      bank_transfer: 'تحويل بنكي', other: 'أخرى',
    }
    exportToCsv(
      data.revenueByMethod.map((m) => ({
        'طريقة الدفع': methodLabelsMap[m.method] || m.method,
        'الإجمالي (ج)': m.total,
        'عدد المعاملات': m.count,
      })),
      `${gymName}-طرق-الدفع-${date}`
    )

    // Sheet 3: Member growth
    exportToCsv(
      data.memberGrowth.map((m) => ({ الشهر: m.label, 'أعضاء جدد': m.newMembers })),
      `${gymName}-نمو-الأعضاء-${date}`
    )
  }

  if (loading && !data) {
    return <DashboardChartSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-400">
        <p>تعذّر تحميل التقارير</p>
        <p className="text-sm text-faint mt-1">{error}</p>
      </div>
    )
  }

  const totals = data?.totals
  const revenueChart = data?.revenueChart || []
  const memberGrowth = data?.memberGrowth || []
  const revenueByMethod = data?.revenueByMethod || []
  const subscriptionsByStatus = data?.subscriptionsByStatus || []

  const statCards = [
    {
      label: 'إجمالي الإيرادات',
      value: formatCurrency(totals?.allTimeRevenue ?? 0),
      icon: Wallet,
      color: 'text-[#22C55E]',
      bg: 'bg-[#22C55E]/10',
    },
    {
      label: 'إجمالي الأعضاء',
      value: String(totals?.totalMembers ?? 0),
      icon: Users,
      color: 'text-[#4ADE80]',
      bg: 'bg-[#4ADE80]/10',
    },
    {
      label: 'الاشتراكات الفعّالة',
      value: String(totals?.activeSubs ?? 0),
      icon: CreditCard,
      color: 'text-[#3B82F6]',
      bg: 'bg-[#3B82F6]/10',
    },
    {
      label: 'متوسط الإيراد/عضو',
      value: formatCurrency(
        totals && totals.totalMembers > 0
          ? totals.allTimeRevenue / totals.totalMembers
          : 0
      ),
      icon: TrendingUp,
      color: 'text-[#F59E0B]',
      bg: 'bg-[#F59E0B]/10',
    },
  ]

  // Pie data for payment methods
  const methodPieData = revenueByMethod
    .filter((m) => m.total > 0)
    .map((m) => ({
      name: methodLabels[m.method] || m.method,
      value: m.total,
    }))

  // Pie data for subscription statuses
  const statusPieData = subscriptionsByStatus
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: statusLabels[s.status] || s.status,
      value: s.count,
    }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[#22C55E]" />
          </div>
          <div>
            <h2 className="font-cairo font-bold text-2xl">التقارير</h2>
            <p className="text-sm text-muted-c">نظرة تحليلية على أداء الجيم</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={!data}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#22C55E]/40 text-[#22C55E] rounded-xl text-sm font-semibold hover:bg-[#22C55E]/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          تصدير CSV
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="glass-card p-5 rounded-2xl">
            <div
              className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center mb-4`}
            >
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className={`text-2xl font-bold font-cairo mb-1 ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-sm text-muted-c">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue + Member growth charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="font-cairo font-bold text-lg mb-1">إيرادات آخر 6 شهور</h3>
          <p className="text-sm text-faint mb-6">إجمالي المدفوعات الشهرية</p>
          {revenueChart.length > 0 ? (
            <div className="h-64" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChart}>
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111118',
                      border: '1px solid #1F1F2E',
                      borderRadius: '12px',
                      color: '#fff',
                      fontFamily: 'Cairo',
                    }}
                    formatter={(value) => [formatCurrency(Number(value)), 'الإيرادات']}
                  />
                  <Bar dataKey="revenue" fill="#22C55E" radius={[6, 6, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-faint">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>مفيش بيانات إيرادات بعد</p>
              </div>
            </div>
          )}
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <h3 className="font-cairo font-bold text-lg mb-1">أعضاء جدد شهرياً</h3>
          <p className="text-sm text-faint mb-6">نمو قاعدة الأعضاء</p>
          {memberGrowth.length > 0 ? (
            <div className="h-64" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberGrowth}>
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111118',
                      border: '1px solid #1F1F2E',
                      borderRadius: '12px',
                      color: '#fff',
                      fontFamily: 'Cairo',
                    }}
                    formatter={(value) => [value, 'أعضاء جدد']}
                  />
                  <Bar dataKey="newMembers" fill="#4ADE80" radius={[6, 6, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-faint">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>مفيش بيانات أعضاء بعد</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment methods + Subscription status */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="font-cairo font-bold text-lg mb-1">الإيرادات حسب طريقة الدفع</h3>
          <p className="text-sm text-faint mb-6">آخر 12 شهر</p>
          {methodPieData.length > 0 ? (
            <div className="h-64" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={methodPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.name}: ${formatCurrency(Number(entry.value))}`}
                    labelLine={false}
                  >
                    {methodPieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111118',
                      border: '1px solid #1F1F2E',
                      borderRadius: '12px',
                      color: '#fff',
                      fontFamily: 'Cairo',
                    }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-faint">
              <div className="text-center">
                <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>مفيش مدفوعات بعد</p>
              </div>
            </div>
          )}
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <h3 className="font-cairo font-bold text-lg mb-1">توزيع الاشتراكات</h3>
          <p className="text-sm text-faint mb-6">حسب الحالة</p>
          {statusPieData.length > 0 ? (
            <div className="h-64" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {statusPieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111118',
                      border: '1px solid #1F1F2E',
                      borderRadius: '12px',
                      color: '#fff',
                      fontFamily: 'Cairo',
                    }}
                    formatter={(value) => [value, 'اشتراك']}
                  />
                  <Legend
                    wrapperStyle={{ fontFamily: 'Cairo', fontSize: 12, color: '#94A3B8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-faint">
              <div className="text-center">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>مفيش اشتراكات بعد</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
