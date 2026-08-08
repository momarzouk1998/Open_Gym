import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-EG', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' ج'
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF-]/g, '')
    .replace(/--+/g, '-')
    .trim()
}

/**
 * Build a WhatsApp deep link to message a member.
 * Returns null if phone is missing/invalid so the caller can disable the button.
 * Normalizes Egyptian formats: "01012345678" → "201012345678".
 */
export function whatsappUrl(
  phone: string | null | undefined,
  message: string
): string | null {
  if (!phone) return null
  // strip everything but digits
  let digits = phone.replace(/\D/g, '')
  // Egyptian local numbers: leading 0 → replace with 20
  if (digits.startsWith('0') && !digits.startsWith('00')) {
    digits = '20' + digits.slice(1)
  }
  // already has country code (e.g. 201...) or international — keep as-is
  if (digits.length < 8) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

/** Default renewal reminder message template (Arabic). */
export function renewalReminderMessage(
  memberName: string,
  planName: string,
  endDate: string
): string {
  return `أهلاً ${memberName} 👋\nعنوانك في الجيم: خطة "${planName}" بتاعك ${endDate}.\nتفضّل تجدّد اشتراكك عشان تكمل تمارينك؟ 💪`
}

/**
 * Converts an array of objects to a CSV string and triggers a browser download.
 * No external dependencies — pure browser APIs.
 *
 * @param rows     Array of objects (all keys used as headers)
 * @param filename Desired file name (without extension)
 */
export function exportToCsv<T extends Record<string, unknown>>(
  rows: T[],
  filename: string
): void {
  if (!rows.length) return

  const headers = Object.keys(rows[0])
  const escape = (val: unknown): string => {
    const str = String(val ?? '')
    // Wrap in quotes if the value contains comma, newline, or double-quote
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const csvLines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ]

  const bom = '\uFEFF' // UTF-8 BOM so Excel opens Arabic correctly
  const blob = new Blob([bom + csvLines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
