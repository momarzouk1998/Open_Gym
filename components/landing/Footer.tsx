'use client'

import Link from 'next/link'
import { Dumbbell, PhoneCall, MessageCircle } from 'lucide-react'

export function Footer() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '201558282760'

  return (
    <footer id="contact" className="border-t border-app py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#22C55E] flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <span className="font-cairo font-bold text-xl">
                Open<span className="text-[#22C55E]">Gym</span>
              </span>
            </Link>
            <p className="text-muted-c max-w-md leading-relaxed mb-6">
              منصة SaaS متكاملة لإدارة الجيمات في مصر والمنطقة العربية. ساعدنا
              أصحاب الجيمات يربحوا وقت وفلوس.
            </p>
            <p className="text-sm text-faint">by OpenAppo</p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-cairo font-bold mb-4">روابط سريعة</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#features"
                  className="text-muted-c hover:text-[#22C55E] transition-colors"
                >
                  المميزات
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="text-muted-c hover:text-[#22C55E] transition-colors"
                >
                  التجربة المجانية
                </Link>
              </li>
              <li>
                <Link
                  href="#how"
                  className="text-muted-c hover:text-[#22C55E] transition-colors"
                >
                  كيف يعمل
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-muted-c hover:text-[#22C55E] transition-colors"
                >
                  تسجيل الدخول
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-cairo font-bold mb-4">تواصل معنا</h4>
            <div className="space-y-3">
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-muted-c hover:text-[#22C55E] transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg surface flex items-center justify-center group-hover:bg-[#22C55E]/10 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span>واتساب: تواصل معنا فوراً</span>
              </a>
              <a
                href="tel:01558282760"
                className="flex items-center gap-3 text-muted-c hover:text-[#22C55E] transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg surface flex items-center justify-center group-hover:bg-[#22C55E]/10 transition-colors">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <span>01558282760</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-app flex items-center justify-center">
          <p className="text-sm text-faint">
            © {new Date().getFullYear()} OpenGym — جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </footer>
  )
}
