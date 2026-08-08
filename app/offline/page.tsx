'use client'

import Link from 'next/link'
import { WifiOff, RefreshCcw } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-app flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-[#F59E0B]/10 flex items-center justify-center mx-auto mb-5">
          <WifiOff className="w-8 h-8 text-[#F59E0B]" />
        </div>
        <h1 className="font-cairo font-bold text-2xl mb-2">غير متصل بالإنترنت</h1>
        <p className="text-muted-c text-sm mb-6">
          تحقق من اتصالك وحاول مرة أخرى
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#22C55E] text-white rounded-xl font-semibold hover:bg-[#16A34A] transition-all"
          >
            <RefreshCcw className="w-4 h-4" />
            إعادة المحاولة
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-5 py-3 border border-app text-soft rounded-xl font-semibold hover:surface transition-all"
          >
            الرجوع للوحة التحكم
          </Link>
        </div>
      </div>
    </div>
  )
}
