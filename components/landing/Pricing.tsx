'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import {
  Check,
  X,
  Gift,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Crown,
} from 'lucide-react'
import { PLANS } from '@/lib/billing'
import { ADDONS } from '@/lib/addons'

// ─── Comparison rows — drives the table automatically from billing/addons ─────
const BASE_FEATURES = [
  { label: 'أعضاء غير محدودين',        starter: true,  pro: true  },
  { label: 'اشتراكات ومدفوعات',          starter: true,  pro: true  },
  { label: 'تقارير أساسية',              starter: true,  pro: true  },
  { label: 'فرع واحد',                   starter: true,  pro: true  },
  { label: 'دعم فني',                    starter: true,  pro: true  },
]

// Addons: Starter pays extra, Pro includes for free
const ADDON_FEATURES = [
  { label: 'المصروفات والخزنة',          addonPrice: ADDONS.expenses.price },
  { label: 'الموظفون والصلاحيات',        addonPrice: ADDONS.staff.price    },
  { label: 'المدربون',                   addonPrice: ADDONS.trainers.price  },
  { label: 'الكلاسات والحجوزات',         addonPrice: ADDONS.classes.price   },
  { label: 'إدارة الفروع المتعددة',      addonPrice: ADDONS.branches.price  },
  { label: 'تقارير متقدمة + تصدير Excel',addonPrice: ADDONS.advanced_reports.price },
]

const PRO_ONLY = [
  { label: 'أولوية الدعم الفني' },
]

// Total if Starter + all addons
const ALL_ADDONS_PRICE = Object.values(ADDONS).reduce((s, a) => s + a.price, 0)
const STARTER_ALL_IN   = PLANS.starter.price + ALL_ADDONS_PRICE

// How much Pro saves
const PRO_SAVING = STARTER_ALL_IN - PLANS.pro.price

const containerVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 16 } },
}

export function Pricing() {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#22C55E]/8 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* ── Header ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-sm text-[#4ADE80] font-medium mb-5">
            <Gift className="w-4 h-4" />
            تجربة مجانية — كل المميزات مفتوحة
          </div>

          <h2 className="font-cairo font-bold text-3xl sm:text-4xl lg:text-5xl mb-4 leading-tight">
            ابدأ مجاناً، اختار{' '}
            <span className="text-[#22C55E]">اللي يناسبك</span>
          </h2>
          <p className="text-lg text-muted-c max-w-2xl mx-auto">
            7 أيام تجربة مجانية بكل المميزات — من غير كريدت كارد ولا التزام.
            بعدها اختار الباقة اللي تناسب جيمك.
          </p>
        </motion.div>

        {/* ── Plan Cards ─────────────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="grid sm:grid-cols-2 gap-5 mb-10"
        >
          {/* Starter */}
          <motion.div variants={itemVariants} className="glass-card rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-app">
              <h3 className="font-cairo font-bold text-2xl mb-1">{PLANS.starter.name}</h3>
              <p className="text-sm text-muted-c mb-4">{PLANS.starter.description}</p>
              <div className="flex items-end gap-1.5">
                <span className="text-4xl font-black font-cairo text-strong">
                  {PLANS.starter.price.toLocaleString('ar-EG')}
                </span>
                <span className="text-muted-c mb-1.5 text-sm">ج / شهر</span>
              </div>
              <p className="text-xs text-faint mt-2">الإضافات اختيارية بسعر منفصل</p>
            </div>
            <div className="p-6">
              <Link
                href="/register"
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-[#22C55E]/40 text-[#22C55E] rounded-xl font-semibold hover:bg-[#22C55E]/5 transition-all mb-4"
              >
                ابدأ التجربة المجانية
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <ul className="space-y-2.5">
                {BASE_FEATURES.map((f) => (
                  <li key={f.label} className="flex items-center gap-2.5 text-sm text-soft">
                    <Check className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                    {f.label}
                  </li>
                ))}
                {ADDON_FEATURES.map((f) => (
                  <li key={f.label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2.5 text-faint">
                      <X className="w-4 h-4 text-faint flex-shrink-0" />
                      {f.label}
                    </span>
                    <span className="text-xs text-faint bg-app border border-app px-2 py-0.5 rounded-lg whitespace-nowrap">
                      +{f.addonPrice} ج
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Pro */}
          <motion.div
            variants={itemVariants}
            className="glass-card rounded-2xl overflow-hidden border-2 border-[#22C55E]/40 relative"
          >
            {/* Popular badge */}
            <div className="absolute -top-px right-6 flex items-center gap-1 px-3 py-1.5 bg-[#22C55E] rounded-b-xl text-xs font-bold text-white">
              <Crown className="w-3 h-3" />
              الأفضل للنمو
            </div>

            <div className="p-6 border-b border-app bg-gradient-to-br from-[#22C55E]/5 to-transparent pt-10">
              <h3 className="font-cairo font-bold text-2xl mb-1">{PLANS.pro.name}</h3>
              <p className="text-sm text-muted-c mb-4">{PLANS.pro.description}</p>
              <div className="flex items-end gap-1.5">
                <span className="text-4xl font-black font-cairo text-strong">
                  {PLANS.pro.price.toLocaleString('ar-EG')}
                </span>
                <span className="text-muted-c mb-1.5 text-sm">ج / شهر</span>
              </div>
              {/* Savings callout */}
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20">
                <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" />
                <span className="text-xs text-[#4ADE80] font-semibold">
                  توفير {PRO_SAVING.toLocaleString('ar-EG')} ج/شهر مقارنةً بـ Starter + كل الإضافات
                </span>
              </div>
            </div>

            <div className="p-6">
              <Link
                href="/register"
                className="group w-full flex items-center justify-center gap-2 py-3 bg-[#22C55E] text-white rounded-xl font-bold hover:bg-[#16A34A] transition-all hover:shadow-lg hover:shadow-[#22C55E]/25 mb-4"
              >
                ابدأ التجربة المجانية
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </Link>
              <ul className="space-y-2.5">
                {BASE_FEATURES.map((f) => (
                  <li key={f.label} className="flex items-center gap-2.5 text-sm text-soft">
                    <Check className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                    {f.label}
                  </li>
                ))}
                {ADDON_FEATURES.map((f) => (
                  <li key={f.label} className="flex items-center gap-2.5 text-sm text-soft">
                    <Check className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                    <span>{f.label}</span>
                    <span className="text-xs text-[#22C55E] bg-[#22C55E]/10 px-1.5 py-0.5 rounded-md font-medium mr-auto whitespace-nowrap">
                      مدمج
                    </span>
                  </li>
                ))}
                {PRO_ONLY.map((f) => (
                  <li key={f.label} className="flex items-center gap-2.5 text-sm text-soft">
                    <Check className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                    {f.label}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Trust signals ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-faint"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
            من غير كريدت كارد
          </span>
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#22C55E]" />
            إلغاء في أي وقت
          </span>
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#22C55E]" />
            كل المميزات مفتوحة في التجربة
          </span>
        </motion.div>

        {/* ── Addons note for Starter ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-10 p-5 rounded-2xl border border-app bg-app/40"
        >
          <p className="text-sm font-semibold text-soft mb-3 text-center">
            أسعار الإضافات لباقة Starter
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ADDON_FEATURES.map((f) => (
              <div key={f.label} className="flex items-center justify-between px-3 py-2 surface rounded-xl border border-app text-xs">
                <span className="text-muted-c">{f.label}</span>
                <span className="font-bold text-[#22C55E] mr-2 whitespace-nowrap">+{f.addonPrice} ج</span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-faint mt-3">
            أو خذ كلهم مع Pro بـ{' '}
            <span className="text-[#22C55E] font-semibold">
              {PLANS.pro.price.toLocaleString('ar-EG')} ج
            </span>
            {' '}بدل{' '}
            <span className="line-through">{STARTER_ALL_IN.toLocaleString('ar-EG')} ج</span>
          </p>
        </motion.div>

      </div>
    </section>
  )
}
