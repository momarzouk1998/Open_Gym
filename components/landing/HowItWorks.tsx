'use client'

import { motion } from 'motion/react'
import { UserPlus, ClipboardList, LineChart } from 'lucide-react'

const steps = [
  {
    number: '1',
    icon: UserPlus,
    title: 'سجّل جيمك',
    desc: 'أدخل بيانات جيمك في دقيقتين. اسم، تليفون، باقة — وإنت جاهز.',
  },
  {
    number: '2',
    icon: ClipboardList,
    title: 'أضف أعضاءك',
    desc: 'أضف خططك وأعضاءك واشتراكاتهم في خطوات بسيطة ومنسقة.',
  },
  {
    number: '3',
    icon: LineChart,
    title: 'إدّر وحلّل',
    desc: 'شوف أرباحك وتقاريرك لحظة بلحظة. خُذ قرارات أذكى.',
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-sm text-[#4ADE80] font-medium mb-4">
            كيف يشتغل
          </span>
          <h2 className="font-cairo font-bold text-3xl sm:text-4xl lg:text-5xl mb-4">
            ابدأ في <span className="text-[#22C55E]">3 خطوات</span>
          </h2>
        </motion.div>

        <div className="relative">
          {/* Animated connecting line */}
          <motion.div
            className="hidden md:block absolute top-1/2 right-[15%] left-[15%] h-px bg-gradient-to-l from-[#22C55E]/0 via-[#22C55E]/40 to-[#22C55E]/0"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            style={{ originX: 0.5 }}
          />

          <div className="grid md:grid-cols-3 gap-8 relative">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{
                  delay: i * 0.2,
                  type: 'spring',
                  stiffness: 80,
                  damping: 14,
                }}
                className="text-center group"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative inline-block mb-6"
                >
                  <motion.div
                    whileHover={{
                      boxShadow: '0 0 40px rgba(34,197,94,0.3)',
                    }}
                    className="w-20 h-20 rounded-2xl surface border border-[#22C55E]/30 flex items-center justify-center mx-auto transition-all"
                  >
                    <step.icon className="w-9 h-9 text-[#22C55E]" />
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: i * 0.2 + 0.4,
                      type: 'spring',
                      stiffness: 200,
                    }}
                    className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-[#22C55E] text-white font-bold flex items-center justify-center font-cairo text-sm"
                  >
                    {step.number}
                  </motion.div>
                </motion.div>
                <h3 className="font-cairo font-bold text-xl mb-3">{step.title}</h3>
                <p className="text-muted-c leading-relaxed max-w-xs mx-auto">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
