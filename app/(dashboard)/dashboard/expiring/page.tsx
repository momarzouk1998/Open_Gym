'use client'

import { useApi } from '@/hooks/useApi'
import {
  formatDate,
  whatsappUrl,
  renewalReminderMessage,
  reEngagementMessage,
} from '@/lib/utils'
import { useGymStore } from '@/store/gym-store'
import {
  Clock,
  AlertTriangle,
  MessageCircle,
  Loader2,
  CalendarClock,
  UserX,
} from 'lucide-react'

interface ExpiringSub {
  id: string
  endDate: string
  member: { id: string; fullName: string; phone: string | null }
  plan: { name: string }
}

interface AtRiskMember {
  id: string
  fullName: string
  phone: string | null
  lastVisit: string | null
}

interface ExpiringData {
  expiring: ExpiringSub[]
  expired: ExpiringSub[]
  atRisk: AtRiskMember[]
}

function StatusBadge({ status }: { status: 'expiring' | 'expired' }) {
  if (status === 'expiring') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#F59E0B]/10 text-[#F59E0B]">
        <Clock className="w-3 h-3" />
        قرب الانتهاء
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#EF4444]/10 text-[#EF4444]">
      <AlertTriangle className="w-3 h-3" />
      منتهي
    </span>
  )
}

function SubRow({ sub, status }: { sub: ExpiringSub; status: 'expiring' | 'expired' }) {
  const msg = renewalReminderMessage(
    sub.member.fullName,
    sub.plan.name,
    formatDate(sub.endDate)
  )
  const waUrl = whatsappUrl(sub.member.phone, msg)

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-app hover:surface-2 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-strong truncate">
            {sub.member.fullName}
          </span>
          <StatusBadge status={status} />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-c">
          <span>الخطة: {sub.plan.name}</span>
          <span>ينتهي: {formatDate(sub.endDate)}</span>
          {sub.member.phone ? (
            <span dir="ltr">{sub.member.phone}</span>
          ) : (
            <span className="text-[#EF4444]">لا يوجد تليفون</span>
          )}
        </div>
      </div>

      {/* WhatsApp button */}
      {waUrl ? (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="تذكير عبر واتساب"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#25D366] text-white text-sm font-medium hover:bg-[#1ebe5d] transition-colors whitespace-nowrap"
        >
          <MessageCircle className="w-4 h-4" />
          تذكير
        </a>
      ) : (
        <button
          disabled
          title="لا يوجد تليفون مسجّل للعضو"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-app border border-app text-muted-c text-sm font-medium opacity-50 cursor-not-allowed whitespace-nowrap"
        >
          <MessageCircle className="w-4 h-4" />
          تذكير
        </button>
      )}
    </div>
  )
}

function AtRiskRow({ member, gymName }: { member: AtRiskMember; gymName: string }) {
  const msg = reEngagementMessage(member.fullName, gymName)
  const waUrl = whatsappUrl(member.phone, msg)

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-app hover:surface-2 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-strong truncate">{member.fullName}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-c">
          <span>
            {member.lastVisit
              ? `آخر زيارة: ${formatDate(member.lastVisit)}`
              : 'لم يسجّل حضور من قبل'}
          </span>
          {member.phone ? (
            <span dir="ltr">{member.phone}</span>
          ) : (
            <span className="text-[#EF4444]">لا يوجد تليفون</span>
          )}
        </div>
      </div>

      {waUrl ? (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="اطمئن عليه عبر واتساب"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#25D366] text-white text-sm font-medium hover:bg-[#1ebe5d] transition-colors whitespace-nowrap"
        >
          <MessageCircle className="w-4 h-4" />
          تواصل
        </a>
      ) : (
        <button
          disabled
          title="لا يوجد تليفون مسجّل للعضو"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-app border border-app text-muted-c text-sm font-medium opacity-50 cursor-not-allowed whitespace-nowrap"
        >
          <MessageCircle className="w-4 h-4" />
          تواصل
        </button>
      )}
    </div>
  )
}

function Section({
  title,
  icon: Icon,
  iconColor,
  items,
  status,
  emptyMsg,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  items: ExpiringSub[]
  status: 'expiring' | 'expired'
  emptyMsg: string
}) {
  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl surface flex items-center justify-center">
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <h3 className="font-cairo font-bold text-lg">{title}</h3>
        </div>
        <span className="px-3 py-1 rounded-full surface-2 text-sm font-bold text-strong">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="py-10 text-center text-muted-c">
          <Icon className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>{emptyMsg}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((sub) => (
            <SubRow key={sub.id} sub={sub} status={status} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ExpiringPage() {
  const { data, loading, error } = useApi<ExpiringData>('/expiring')
  const { gym } = useGymStore()

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#22C55E]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20 text-[#EF4444]">
        <p>تعذّر تحميل البيانات</p>
        <p className="text-sm text-muted-c mt-1">{error}</p>
      </div>
    )
  }

  const expiring = data?.expiring || []
  const expired = data?.expired || []
  const atRisk = data?.atRisk || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
          <CalendarClock className="w-5 h-5 text-[#22C55E]" />
        </div>
        <div>
          <h2 className="font-cairo font-bold text-2xl">التجديدات والمنتهية</h2>
          <p className="text-sm text-muted-c">
            ذكّر الأعضاء اللي قرب اشتراكهم يخلص أو خلص فعلاً
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div>
            <div className="text-2xl font-bold text-strong">{expiring.length}</div>
            <div className="text-xs text-muted-c">قرب الانتهاء (7 أيام)</div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#EF4444]/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
          </div>
          <div>
            <div className="text-2xl font-bold text-strong">{expired.length}</div>
            <div className="text-xs text-muted-c">منتهية</div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center">
            <UserX className="w-5 h-5 text-[#8B5CF6]" />
          </div>
          <div>
            <div className="text-2xl font-bold text-strong">{atRisk.length}</div>
            <div className="text-xs text-muted-c">معرّضون للتوقف</div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl surface flex items-center justify-center">
              <UserX className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <div>
              <h3 className="font-cairo font-bold text-lg">أعضاء معرّضون للتوقف</h3>
              <p className="text-xs text-muted-c">مشتركين نشطين مالهمش حضور من 14 يوم فأكتر</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full surface-2 text-sm font-bold text-strong">
            {atRisk.length}
          </span>
        </div>

        {atRisk.length === 0 ? (
          <div className="py-10 text-center text-muted-c">
            <UserX className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>كل الأعضاء النشطين بيحضروا بانتظام 🎉</p>
          </div>
        ) : (
          <div className="space-y-2">
            {atRisk.map((m) => (
              <AtRiskRow key={m.id} member={m} gymName={gym?.name || 'الجيم'} />
            ))}
          </div>
        )}
      </div>

      <Section
        title="قرب الانتهاء"
        icon={Clock}
        iconColor="text-[#F59E0B]"
        items={expiring}
        status="expiring"
        emptyMsg="مفيش اشتراكات قرب تنتهي 🎉"
      />

      <Section
        title="منتهية"
        icon={AlertTriangle}
        iconColor="text-[#EF4444]"
        items={expired}
        status="expired"
        emptyMsg="مفيش اشتراكات منتهية"
      />
    </div>
  )
}
