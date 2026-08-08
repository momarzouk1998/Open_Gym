'use client'

import Link from 'next/link'
import { useGymStore } from '@/store/gym-store'
import { useApi } from '@/hooks/useApi'
import { formatCurrency } from '@/lib/utils'
import {
  Users,
  CreditCard,
  Wallet,
  AlertCircle,
  Plus,
  TrendingUp,
  RefreshCcw,
  Receipt,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { StatCardsSkeleton, DashboardChartSkeleton } from '@/components/ui/Skeleton'

interface DashboardStats {
  totalMembers: number
  activeSubs: number
  expiringSoon: number
  monthlyRevenue: number
}

interface ExpiringSub {
  id: string
  member: { id: string; fullName: string; phone: string }
  plan: { name: string }
  endDate: string
}

interface DashboardData {
  stats: DashboardStats
  revenueChart: { month: string; revenue: number; label: string }[]
  expiringSoon: ExpiringSub[]
}


export default function DashboardHome() {
  const { gym, user } = useGymStore()
  const { data, loading } = useApi<DashboardData>('/dashboard')

  const stats = data?.stats
  const revenueChart = data?.revenueChart || []
  const expiringSoon = data?.expiringSoon || []

  const gymName = gym?.name || 'جيمك'
  const userName = user?.fullName || ''
  const isTrial = gym?.status === 'trial'

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-cairo font-bold text-2xl mb-1">
            أهلاً {userName ? `${userName}` : ''} 👋
          </h2>
          <p className="text-muted-c">إليك ملخص {gymName} اليوم</p>
        </div>
        <Link
          href="/dashboard/members/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#22C55E] text-white rounded-xl font-semibold hover:bg-[#16A34A] transition-all"
        >
          <Plus className="w-5 h-5" />
          إضافة عضو
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/dashboard/members/new', icon: Users,      label: 'عضو جديد',      color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/10' },
          { href: '/dashboard/subscriptions', icon: RefreshCcw, label: 'تجديد اشتراك', color: 'text-[#4ADE80]', bg: 'bg-[#4ADE80]/10' },
          { href: '/dashboard/payments',     icon: Wallet,     label: 'استلام دفعة',   color: 'text-[#3B82F6]', bg: 'bg-[#3B82F6]/10' },
          { href: '/dashboard/expenses',     icon: Receipt,    label: 'تسجيل مصروف',  color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10' },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="glass-card p-4 rounded-2xl flex flex-col items-center gap-2 hover:border-white/10 hover:scale-[1.02] transition-all active:scale-[0.98]"
          >
            <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center`}>
              <action.icon className={`w-5 h-5 ${action.color}`} />
            </div>
            <span className="text-xs font-medium text-soft text-center">{action.label}</span>
          </Link>
        ))}
      </div>

      {loading && !data ? (
        <>
          <StatCardsSkeleton />
          <DashboardChartSkeleton />
        </>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl hover:border-[#22C55E]/30 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#22C55E]" />
                </div>
                <TrendingUp className="w-4 h-4 text-[#22C55E]" />
              </div>
              <div className="text-3xl font-bold font-cairo mb-1">
                {stats?.totalMembers ?? 0}
              </div>
              <div className="text-sm text-muted-c">إجمالي الأعضاء</div>
            </div>

            <div className="glass-card p-5 rounded-2xl hover:border-[#4ADE80]/30 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-[#4ADE80]/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#4ADE80]" />
                </div>
              </div>
              <div className="text-3xl font-bold font-cairo mb-1">
                {stats?.activeSubs ?? 0}
              </div>
              <div className="text-sm text-muted-c">الاشتراكات الفعّالة</div>
            </div>

            {isTrial ? (
              <Link
                href="/dashboard/settings"
                className="glass-card p-5 rounded-2xl hover:border-[#22C55E]/30 transition-colors group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#22C55E]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between mb-4 relative">
                  <div className="w-11 h-11 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-[#22C55E]" />
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#22C55E]/15 text-[#4ADE80] font-medium">
                    بعد الاشتراك
                  </span>
                </div>
                <div className="text-lg font-bold font-cairo mb-1 text-[#22C55E] relative">
                  تتبّع الإيرادات
                </div>
                <div className="text-sm text-muted-c relative">
                  اشترك عشان تشوف إيراداتك بالتفصيل
                </div>
              </Link>
            ) : (
              <div className="glass-card p-5 rounded-2xl hover:border-[#22C55E]/30 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-[#22C55E]" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-[#22C55E]" />
                </div>
                <div className="text-3xl font-bold font-cairo mb-1">
                  {formatCurrency(stats?.monthlyRevenue ?? 0)}
                </div>
                <div className="text-sm text-muted-c">إيرادات الشهر</div>
              </div>
            )}

            <div className="glass-card p-5 rounded-2xl hover:border-[#F59E0B]/30 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-[#F59E0B]" />
                </div>
              </div>
              <div className="text-3xl font-bold font-cairo mb-1">
                {stats?.expiringSoon ?? 0}
              </div>
              <div className="text-sm text-muted-c">تنتهي قريباً (7 أيام)</div>
            </div>
          </div>

          {/* Chart + Expiring */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
              <h3 className="font-cairo font-bold text-lg mb-1">إيرادات آخر 6 شهور</h3>
              <p className="text-sm text-faint mb-6">إجمالي المدفوعات الشهرية</p>

              {isTrial ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center max-w-sm">
                    <div className="w-14 h-14 rounded-2xl bg-[#22C55E]/10 flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-7 h-7 text-[#22C55E]" />
                    </div>
                    <p className="font-medium text-soft mb-1">
                      تتبّع الإيرادات بالتفصيل
                    </p>
                    <p className="text-sm text-muted-c mb-4">
                      بعد ما تشترك، هيظهرلك رسم بياني لإيراداتك الشهرية ومعدّل النمو
                    </p>
                    <Link
                      href="/dashboard/settings"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-white rounded-xl text-sm font-semibold hover:bg-[#16A34A] transition-colors"
                    >
                      اشترك لرؤية الإيرادات
                    </Link>
                  </div>
                </div>
              ) : revenueChart.length > 0 ? (
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
                        labelFormatter={(label) => String(label)}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="#22C55E"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={50}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-faint">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>الرسم البياني سيظهر هنا بعد إضافة المدفوعات</p>
                  </div>
                </div>
              )}
            </div>

            {/* Expiring Subscriptions */}
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="font-cairo font-bold text-lg mb-1">تنتهي قريباً</h3>
              <p className="text-sm text-faint mb-6">اشتراكات خلال 7 أيام</p>

              {expiringSoon.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {expiringSoon.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-3 surface rounded-xl"
                    >
                      <div>
                        <div className="font-medium text-sm">{sub.member.fullName}</div>
                        <div className="text-xs text-faint">{sub.plan.name}</div>
                      </div>
                      <div className="text-left">
                        <div className="text-xs text-[#F59E0B] font-medium">
                          {new Date(sub.endDate).toLocaleDateString('ar-EG')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-faint">
                  <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">مفيش اشتراكات تنتهي قريباً</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
