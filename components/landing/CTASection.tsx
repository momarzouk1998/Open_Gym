'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowLeft, Sparkles } from 'lucide-react'

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ type: 'spring', stiffness: 60, damping: 16 }}
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="relative rounded-3xl overflow-hidden p-12 sm:p-16 text-center">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#16A34A] via-[#22C55E] to-[#16A34A]" />
          <div className="absolute inset-0 grid-bg opacity-20" />

          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-6"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-strong">جاهز تبدأ؟</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="font-cairo font-black text-4xl sm:text-5xl text-strong mb-4"
            >
              ابدأ تجربتك المجانية دلوقتي
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-lg text-soft mb-8 max-w-xl mx-auto"
            >
              انضم لعشرات الجيمات التي تعتمد على OpenGym لإدارة أعمالها بشكل أذكى
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#16A34A] rounded-xl font-bold hover:bg-white/95 transition-all hover:shadow-2xl"
              >
                جرّب مجاناً 7 أيام
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <p className="mt-6 text-sm text-muted-c">
              بدون كريدت كارد — بدون التزام
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
