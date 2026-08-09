import { ADDONS, ALL_ADDON_KEYS } from './addons'
import { AddonKey } from '@prisma/client'

// ─── PLAN DEFINITIONS ──────────────────────────────────────────────────────────
//
// SINGLE SOURCE OF TRUTH for all pricing in the app.
// Change prices here → everything updates automatically:
//   • Landing page Pricing section
//   • Dashboard Settings plan picker
//   • API validation (validPrices)
//   • Admin panel
//
// Pro includes ALL addons at no extra charge.
// Starter users pay addons individually on top of the base price.
// ──────────────────────────────────────────────────────────────────────────────

export const PLANS = {
  starter: {
    key: 'starter' as const,
    name: 'Starter',
    price: 399,
    originalPrice: 449,
    description: 'مناسب للجيمات الصغيرة والمتوسطة',
    // What's included at base (no addons needed)
    includes: [
      'أعضاء غير محدودين',
      'اشتراكات ومدفوعات',
      'تقارير أساسية',
      'فرع واحد',
      'دعم فني',
    ] as string[],
    // Addons can be added individually — included in Pro by default
    addonsIncluded: false,
    proOnly: false,
  },
  pro: {
    key: 'pro' as const,
    name: 'Pro',
    price: 699,
    originalPrice: 849,
    description: 'كل مميزات Starter + جميع الإضافات مدمجة',
    popular: true,
    // Pro includes everything in Starter PLUS all addons
    includes: [
      'كل مميزات Starter',
      'المصروفات والخزنة',
      'الموظفون والصلاحيات',
      'المدربون',
      'الكلاسات والحجوزات',
      'إدارة الفروع المتعددة',
      'التقارير المتقدمة وتصدير Excel',
      'أولوية الدعم الفني',
    ] as string[],
    // Pro comes with ALL addons — no extra charges
    addonsIncluded: true,
    proOnly: false,
  },
} as const

export type PlanKey = keyof typeof PLANS

/** Valid base prices for API validation — derived from PLANS automatically */
export const VALID_PLAN_PRICES: number[] = Object.values(PLANS).map((p) => p.price)

/**
 * Returns the addon keys that should be assigned when a plan is selected.
 * Pro → all addons. Starter → no addons (user buys individually).
 */
export function getAddonsForPlan(planKey: PlanKey): AddonKey[] {
  if (planKey === 'pro') {
    return ALL_ADDON_KEYS as AddonKey[]
  }
  return []
}

/**
 * Resolves a plan key from a base price.
 * Used in API routes to map price → plan key.
 */
export function getPlanByPrice(price: number): PlanKey | null {
  const entry = Object.entries(PLANS).find(([, p]) => p.price === price)
  return entry ? (entry[0] as PlanKey) : null
}

// ─── BILLING CALCULATIONS ─────────────────────────────────────────────────────

interface BillBreakdown {
  base: number
  addonsTotal: number
  total: number
  addonsDetail: { key: string; name: string; price: number }[]
  planIncludesAddons: boolean
}

/**
 * Calculate the monthly bill for a gym.
 * If the plan is Pro, addons are included in the base price — no extra charge.
 */
export function calculateGymBill(
  basePlanPrice: number,
  addons: AddonKey[]
): BillBreakdown {
  const planKey = getPlanByPrice(basePlanPrice)
  const planIncludesAddons = planKey ? PLANS[planKey].addonsIncluded : false

  // Pro: addons are included — no extra charge
  if (planIncludesAddons) {
    return {
      base: basePlanPrice,
      addonsTotal: 0,
      total: basePlanPrice,
      addonsDetail: [],
      planIncludesAddons: true,
    }
  }

  // Starter: charge per addon
  const addonsDetail = addons
    .filter((key) => key in ADDONS)
    .map((key) => ({
      key,
      name: ADDONS[key as keyof typeof ADDONS].name,
      price: ADDONS[key as keyof typeof ADDONS].price,
    }))

  const addonsTotal = addonsDetail.reduce((sum, a) => sum + a.price, 0)

  return {
    base: basePlanPrice,
    addonsTotal,
    total: basePlanPrice + addonsTotal,
    addonsDetail,
    planIncludesAddons: false,
  }
}

export function calculateAddonProration(
  addonPrice: number,
  nextBillingDate: Date
): number {
  const today = new Date()
  const daysRemaining = Math.max(
    1,
    Math.ceil(
      (nextBillingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
  )
  const daysInMonth = 30
  return Math.ceil((addonPrice / daysInMonth) * daysRemaining)
}
