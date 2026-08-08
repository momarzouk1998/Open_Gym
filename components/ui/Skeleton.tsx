import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

/** Base shimmer block */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-white/5 dark:bg-white/5',
        className
      )}
    />
  )
}

/** 4-card stats row skeleton */
export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-card p-5 rounded-2xl space-y-4">
          <Skeleton className="w-11 h-11 rounded-xl" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
      ))}
    </div>
  )
}

/** Chart + expiring sidebar skeleton */
export function DashboardChartSkeleton() {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass-card p-6 rounded-2xl space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-44" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 surface rounded-xl">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Members table skeleton */
export function MembersTableSkeleton() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="surface text-sm text-faint">
            <tr>
              {['رقم العضوية', 'الاسم', 'التليفون', 'تاريخ الانتهاء', 'الحالة', ''].map((h) => (
                <th key={h} className="p-4 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-t border-app">
                <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                <td className="p-4"><Skeleton className="h-4 w-28" /></td>
                <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                <td className="p-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                <td className="p-4"><Skeleton className="h-4 w-10" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** Generic list skeleton (payments, subscriptions, expenses) */
export function ListPageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      {/* Search bar */}
      <div className="glass-card p-4 rounded-2xl">
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 surface rounded-xl">
              <Skeleton className="h-4 w-24 flex-shrink-0" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20 flex-shrink-0" />
              <Skeleton className="h-6 w-16 rounded-full flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
