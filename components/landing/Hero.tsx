'use client'

import Link from 'next/link'
import { useRef, useEffect, lazy, Suspense } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react'
import { ArrowLeft, Play, Users, CreditCard, TrendingUp, Sparkles, Activity } from 'lucide-react'

const Hero3D = lazy(() =>
  import('@/components/landing/Hero3D').then((m) => ({ default: m.Hero3D }))
)

// Animated counter using Framer Motion
function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (prefersReducedMotion) {
      if (ref.current) ref.current.textContent = value.toLocaleString('ar-EG')
      return
    }

    const duration = 2000
    let raf = 0
    let start: number | null = null

    const step = (now: number) => {
      if (start === null) start = now
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      if (ref.current) {
        ref.current.textContent = Math.floor(eased * value).toLocaleString('ar-EG')
      }
      if (progress < 1) raf = requestAnimationFrame(step)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          raf = requestAnimationFrame(step)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [value])

  return (
    <span>
      <span ref={ref}>0</span>
      <span className="text-[#22C55E] drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]">{suffix}</span>
    </span>
  )
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 100, damping: 15 },
  },
}

export function Hero() {
  const shouldReduceMotion = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  // Parallax transforms
  const textY = useTransform(scrollYProgress, [0, 1], [0, 100])
  const mockupY = useTransform(scrollYProgress, [0, 1], [0, -50])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100dvh] flex items-center pt-28 pb-12 overflow-hidden bg-[#0A0A0F]"
    >
      {/* Absolute 3D Canvas across the entire hero for immersive feel */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={null}>
          <Hero3D />
        </Suspense>
      </div>

      {/* Grid overlay to give it structure without hiding 3D */}
      <div className="absolute inset-0 z-0 grid-bg opacity-40 pointer-events-none" />

      {/* Glowing atmospheric elements */}
      <motion.div
        className="absolute top-0 right-0 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-[#22C55E]/15 rounded-full blur-[100px] pointer-events-none"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 8, repeat: shouldReduceMotion ? 0 : Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] bg-[#22C55E]/10 rounded-full blur-[100px] pointer-events-none"
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 10, repeat: shouldReduceMotion ? 0 : Infinity, ease: 'easeInOut', delay: 1 }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 h-full flex flex-col justify-center">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          
          {/* Text Content */}
          <motion.div
            style={{ y: textY, opacity }}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="text-center lg:text-right mt-10 lg:mt-0"
          >
            {/* Badge */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(34,197,94,0.4)" }}
              className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 mb-6 backdrop-blur-md transition-shadow"
            >
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#4ADE80] animate-pulse" />
              <span className="text-xs sm:text-sm text-[#4ADE80] font-medium drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]">
                المنصة الأولى لإدارة الجيمات
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={itemVariants}
              className="font-cairo font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] sm:leading-tight mb-6 text-white drop-shadow-lg"
            >
              إدارة جيمك
              <br />
              من <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4ADE80] to-[#22C55E] drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]">شاشة واحدة</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg lg:text-xl text-gray-300 mb-8 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed drop-shadow-md"
            >
              اشتراكات، مدفوعات، تقارير، وموظفين — كل حاجة في مكان واحد. 
              منصة متكاملة ومصممة بأحدث التقنيات لنجاح الجيم الخاص بك.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start w-full sm:w-auto px-4 sm:px-0"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <Link
                  href="/register"
                  className="group flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-[#22C55E] text-white rounded-xl font-bold hover:bg-[#16A34A] transition-all hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] border border-[#4ADE80]/50"
                >
                  ابدأ تجربة مجانية
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1.5 transition-transform" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <Link
                  href="#how"
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-white/5 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/10 backdrop-blur-md transition-all hover:border-white/20"
                >
                  <Play className="w-4 h-4" />
                  شوف كيف يشتغل
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust line */}
            <motion.p
              variants={itemVariants}
              className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-400"
            >
              مفيش كريدت كارد مطلوب • إلغاء في أي وقت
            </motion.p>
          </motion.div>

          {/* Visual: Dashboard Mockup */}
          <motion.div
            style={{ y: mockupY }}
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 60, damping: 20 }}
            className="relative mt-8 lg:mt-0 hidden sm:block"
          >
            {/* Dashboard Mockup Card */}
            <motion.div
              whileHover={{ y: -10, rotateX: 2, rotateY: -2 }}
              className="bg-[#111118]/60 backdrop-blur-xl border border-[#22C55E]/30 p-5 sm:p-7 rounded-2xl sm:rounded-3xl relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(34,197,94,0.2)] transition-all duration-500"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Mock header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 5, repeat: shouldReduceMotion ? 0 : Infinity, ease: 'easeInOut' }}
                    className="w-10 h-10 rounded-xl bg-[#22C55E]/20 flex items-center justify-center border border-[#22C55E]/40 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                  >
                    <Users className="w-5 h-5 text-[#4ADE80]" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-white text-sm sm:text-base">جيم القوة والأبطال</h3>
                    <p className="text-xs text-[#22C55E]">لوحة التحكم المباشرة</p>
                  </div>
                </div>
              </div>

              {/* Mock stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { icon: Users, value: '247', label: 'إجمالي الأعضاء', badge: '+12' },
                  { icon: CreditCard, value: '198', label: 'اشتراكات فعّالة', badge: 'نشط' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.15 }}
                    className="bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/5 hover:border-[#22C55E]/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <stat.icon className="w-5 h-5 text-[#22C55E]" />
                      <span className="text-[10px] sm:text-xs bg-[#22C55E]/20 text-[#4ADE80] px-2 py-1 rounded-md font-bold">
                        {stat.badge}
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black font-cairo text-white">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-gray-400 font-medium">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Mock chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/5"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#22C55E]" />
                    <span className="text-sm sm:text-base font-bold text-white">الإيرادات الشهرية</span>
                  </div>
                  <span className="text-sm sm:text-base font-black text-[#4ADE80] drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">
                    12,400 ج
                  </span>
                </div>
                <div className="flex justify-between items-end h-24 sm:h-32 gap-1.5 sm:gap-2">
                  {[40, 55, 45, 70, 60, 85, 75, 95].map((h, i) => (
                    <motion.div
                      key={i}
                      className="w-full bg-gradient-to-t from-[#22C55E]/20 to-[#22C55E] rounded-t-md relative group"
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 1.2 + i * 0.05, type: 'spring', stiffness: 60 }}
                    >
                      <div className="absolute -top-1 left-0 right-0 h-1 bg-white/30 rounded-t-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Floating badges */}
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 4, repeat: shouldReduceMotion ? 0 : Infinity, ease: 'easeInOut' }}
              className="absolute -top-6 -right-6 lg:-right-10 bg-[#0A0A0F]/80 backdrop-blur-md border border-[#22C55E]/50 px-4 py-3 rounded-2xl z-20 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-xs sm:text-sm font-bold text-white">نمو +25%</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Stats bar - Mobile Optimized */}
        <motion.div
          style={{ opacity }}
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="mt-16 sm:mt-24 grid grid-cols-3 gap-2 sm:gap-8 max-w-4xl mx-auto w-full border-t border-white/5 pt-8 sm:pt-12"
        >
          {[
            { value: 50, suffix: '+', label: 'جيم يثقون بنا' },
            { value: 5000, suffix: '+', label: 'عضو نشط' },
            { value: 1000000, suffix: '+', label: 'جنيه إيرادات' },
          ].map((stat, i) => (
            <motion.div key={i} variants={itemVariants} className="text-center">
              <div className="text-xl sm:text-3xl md:text-5xl font-black font-cairo text-white tracking-tight">
                <Counter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-[10px] sm:text-sm text-gray-400 mt-1 sm:mt-2 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
