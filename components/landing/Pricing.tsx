'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import {
  Check,
  Gift,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react'
import { PLANS } from '@/lib/billing'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 90, damping: 14 },
  },
}

// Highlighted features during the free trial — these are what sell the platform
const trialHighlights = [
  'أعضاء غير محدودين',
  'اشتراكات ومدفوعات كاملة',
  'تقارير أساسية',
  'جرّب كل الإضافات مجاناً',
  'دعم فني عربي',
  'بياناتك آمنة ومحفوظة',
]

export function Pricing() {
  const starter = PLANS.starter

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      {/* Soft background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#22C55E]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header — focused on the free trial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-sm text-[#4ADE80] font-medium mb-5"
          >
            <Gift className="w-4 h-4" />
            تجربة مجانية بالكامل
          </motion.div>

          <h2 className="font-cairo font-bold text-3xl sm:text-4xl lg:text-5xl mb-4 leading-tight">
            جرّب OpenGym <span className="text-[#22C55E]">7 أيام مجاناً</span>
          </h2>
          <p className="text-lg text-muted-c max-w-2xl mx-auto">
            من غير كريدت كارد، من غير التزام. سجّل دلوقتي واستخدم كل المميزات —
            وقرر بعد ما تجرّب بنفسك.
          </p>
        </motion.div>

        {/* Main trial CTA card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ type: 'spring', stiffness: 70, damping: 16 }}
          className="relative max-w-2xl mx-auto"
        >
          <div className="relative rounded-3xl overflow-hidden glass-card glow-green-sm border-2 border-[#22C55E]/30">
            {/* Top highlight strip */}
            <div className="bg-gradient-to-r from-[#22C55E]/20 via-[#22C55E]/10 to-transparent p-6 sm:p-8 border-b border-app">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-[#4ADE80]" />
                    <span className="text-sm font-medium text-[#4ADE80]">
                      باقة Starter
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black font-cairo text-strong">
                      7
                    </span>
                    <span className="text-xl font-bold text-[#22C55E] mb-2">
                      أيام مجاناً
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-faint line-through">
                    {starter.price} ج/شهر
                  </div>
                  <div className="text-2xl font-bold text-[#22C55E] font-cairo">
                    مجاناً دلوقتي
                  </div>
                </div>
              </div>
            </div>

            {/* Trial features */}
            <div className="p-6 sm:p-8">
              <motion.ul
                variants={containerVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="grid sm:grid-cols-2 gap-3 mb-8"
              >
                {trialHighlights.map((feature, idx) => (
                  <motion.li
                    key={idx}
                    variants={itemVariants}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#22C55E]/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                    </div>
                    <span className="text-soft text-sm">{feature}</span>
                  </motion.li>
                ))}
              </motion.ul>

              {/* Trust signals */}
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-6 text-xs text-faint">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
                  من غير كريدت كارد
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                  إلغاء في أي وقت
                </span>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" />
                  كل المميزات مفتوحة
                </span>
              </div>

              {/* Big CTA */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href="/register"
                  className="group w-full flex items-center justify-center gap-2 py-4 bg-[#22C55E] text-white rounded-xl font-bold text-lg hover:bg-[#16A34A] transition-all hover:shadow-xl hover:shadow-[#22C55E]/30"
                >
                  ابدأ التجربة المجانية دلوقتي
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </Link>
              </motion.div>

              <p className="text-center mt-4 text-xs text-faint">
                بعد الـ 7 أيام، تقدر تختار خطتك وندفع عن طريق انستاباي أو فودافون كاش
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
