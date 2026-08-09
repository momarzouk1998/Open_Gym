'use client'

import { motion, useReducedMotion } from 'motion/react'
import {
  CreditCard,
  Wallet,
  Users,
  BarChart3,
  Smartphone,
  Building2,
} from 'lucide-react'

const features = [
  {
    icon: CreditCard,
    title: 'إدارة الاشتراكات',
    desc: 'أضف وجدد اشتراكات في ثوانٍ. خطط مرنة شهري، ربعي، سنوي.',
    color: 'text-[#22C55E]',
    bg: 'bg-[#22C55E]/10',
  },
  {
    icon: Wallet,
    title: 'تتبع المدفوعات',
    desc: 'كاش، انستاباي، فودافون كاش — كل طرق الدفع في مكان واحد.',
    color: 'text-[#4ADE80]',
    bg: 'bg-[#4ADE80]/10',
  },
  {
    icon: Users,
    title: 'إدارة الأعضاء',
    desc: 'بيانات كاملة لكل عضو، تاريخ اشتراكاته، صورة، رقم قومي.',
    color: 'text-[#22C55E]',
    bg: 'bg-[#22C55E]/10',
  },
  {
    icon: BarChart3,
    title: 'تقارير فورية',
    desc: 'أرباح، مصروفات، إحصائيات — كلها لحظية وواضحة.',
    color: 'text-[#4ADE80]',
    bg: 'bg-[#4ADE80]/10',
  },
  {
    icon: Smartphone,
    title: 'يشتغل على الموبايل',
    desc: 'PWA — يُثبّت كتطبيق على موبايلك. زي التطبيق بالظبط.',
    color: 'text-[#22C55E]',
    bg: 'bg-[#22C55E]/10',
  },
  {
    icon: Building2,
    title: 'أكتر من فرع',
    desc: 'إدارة كل فروعك من مكان واحد، تقارير مقارنة بين الفروع.',
    color: 'text-[#4ADE80]',
    bg: 'bg-[#4ADE80]/10',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 100, damping: 14 },
  },
}

export function Features() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background glow — static when reduced motion preferred */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#22C55E]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-sm text-[#4ADE80] font-medium mb-4"
          >
            المميزات
          </motion.span>
          <h2 className="font-cairo font-bold text-3xl sm:text-4xl lg:text-5xl mb-4">
            كل اللي <span className="text-[#22C55E]">جيمك محتاجه</span>
          </h2>
          <p className="text-lg text-muted-c max-w-2xl mx-auto">
            نظام واحد فيه كل أدوات إدارة الجيم. من الأعضاء والاشتراكات للتقارير
            والمصروفات.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              // Respect reduced motion: disable lift on hover
              whileHover={shouldReduceMotion ? undefined : { y: -8, transition: { duration: 0.2 } }}
              className="glass-card p-8 rounded-2xl hover:border-[#22C55E]/30 transition-colors group"
            >
              <motion.div
                // Respect reduced motion: disable icon scale+rotate on hover
                whileHover={shouldReduceMotion ? undefined : { scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className={`w-14 h-14 rounded-xl ${feature.bg} flex items-center justify-center mb-6`}
              >
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </motion.div>
              <h3 className="font-cairo font-bold text-xl mb-3">{feature.title}</h3>
              <p className="text-muted-c leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
