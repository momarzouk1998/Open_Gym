'use client'

import { motion, useReducedMotion } from 'motion/react'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'أحمد محمود',
    role: 'صاحب جيم القوة',
    city: 'القاهرة',
    text: 'وفرنا أكتر من 18 ساعة أسبوعياً كانت تضيع في تسجيل المدفوعات والبحث في الكشوفات. التنبيهات المباشرة خلت نسبة تجديد الاشتراكات تزيد 25%.',
    rating: 5,
  },
  {
    name: 'محمد عبد الله',
    role: 'مدير جيم الأبطال',
    city: 'الإسكندرية',
    text: 'بنسيطر على 3 فروع عندنا بكل سهولة. التقارير المالية والتقرير المجمع بيوضح الإيرادات والمصروفات لحظة بلحظة.',
    rating: 5,
  },
  {
    name: 'خالد السيد',
    role: 'صاحب Fitness Hub',
    city: 'الجيزة',
    text: 'الكاشير والموظفين اتعلموا السيستم في أول يوم. التسجيل والبحث عن الأعضاء بيتم في ثواني، ومفيش أي لغبطة في الحسابات تاني.',
    rating: 5,
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 90, damping: 14 },
  },
}

export function SocialProof() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-[#22C55E]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-sm text-[#4ADE80] font-medium mb-4">
            آراء العملاء
          </span>
          <h2 className="font-cairo font-bold text-3xl sm:text-4xl lg:text-5xl mb-4">
            ماذا يقول <span className="text-[#22C55E]">أصحاب الجيمات</span>
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="grid md:grid-cols-3 gap-8"
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              variants={cardVariants}
              whileHover={{ y: -6 }}
              className="glass-card p-8 rounded-2xl relative hover:border-[#22C55E]/30 transition-colors"
            >
              <Quote className="absolute top-6 left-6 w-10 h-10 text-[#22C55E]/10" />

              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, idx) => (
                  <Star key={idx} className="w-4 h-4 fill-[#22C55E] text-[#22C55E]" />
                ))}
              </div>

              <p className="text-soft leading-relaxed mb-6 relative z-10">
                {t.text}
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-app">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#22C55E] to-[#16A34A] flex items-center justify-center text-white font-bold font-cairo">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold">{t.name}</div>
                  <div className="text-sm text-faint">
                    {t.role} — {t.city}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
