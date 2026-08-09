/**
 * Generate a unique barcode for gym members
 * Format: GYM-{timestamp}-{random}
 */

export function generateBarcode(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `GYM-${timestamp}-${random}`
}

/**
 * Generate a unique barcode for the gym itself
 * Format: GYMLOC-{gym_name}-{random}
 */
export function generateGymBarcode(gymName: string): string {
  const gymPrefix = gymName.substring(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `GYMLOC-${gymPrefix}-${random}`
}

/**
 * Generate attendance URL for gym QR code
 */
export function generateAttendanceUrl(gymSlug: string, baseUrl: string = ''): string {
  const url = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://opengym.openappo.com'
  return `${url}/attendance/${gymSlug}`
}

/**
 * Validate barcode format
 */
export function isValidBarcode(barcode: string): boolean {
  return /^GYM-[A-Z0-9]+-[A-Z0-9]{4}$/.test(barcode)
}

/**
 * Validate gym barcode format
 */
export function isValidGymBarcode(barcode: string): boolean {
  return /^GYMLOC-[A-Z0-9]+-[A-Z0-9]{6}$/.test(barcode)
}

/**
 * Generate member number from gym ID and member count
 */
export function generateMemberNumber(gymId: string, memberCount: number): string {
  const gymPrefix = gymId.substring(0, 4).toUpperCase()
  const memberNum = (memberCount + 1).toString().padStart(5, '0')
  return `${gymPrefix}-${memberNum}`
}