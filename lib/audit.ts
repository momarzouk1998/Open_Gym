/**
 * Audit log helper — records important gym operations to the audit_logs table.
 *
 * Usage in API route handlers:
 *   await audit(gymId, userId, 'member.create', 'member', member.id, { name: member.fullName }, ip)
 *
 * Non-blocking: errors are logged to console but never bubble up to the caller.
 */

import { prisma } from './prisma'
import { getClientIp } from './rate-limit'

export type AuditAction =
  | 'member.create'
  | 'member.update'
  | 'member.delete'
  | 'subscription.create'
  | 'subscription.freeze'
  | 'subscription.unfreeze'
  | 'subscription.cancel'
  | 'payment.create'
  | 'payment.delete'
  | 'expense.create'
  | 'expense.delete'
  | 'plan.create'
  | 'plan.delete'
  | 'staff.create'
  | 'staff.delete'
  | 'trainer.create'
  | 'trainer.delete'
  | 'class.create'
  | 'class.delete'
  | 'branch.create'
  | 'branch.delete'
  | 'gym.update'
  | 'gym.plan_change'
  | 'attendance.check_in'
  | 'gym.barcode_regenerate'
  | 'member.password_reset'

export async function audit(
  gymId: string,
  userId: string,
  action: AuditAction,
  entityType: string,
  entityId?: string | null,
  meta?: any,
  ip?: string | null
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        gymId,
        userId,
        action,
        entityType,
        entityId: entityId ?? null,
        meta: meta ?? undefined,
        ip: ip ?? null,
      },
    })
  } catch (err) {
    // Never crash the main request — just log
    console.error('[audit] Failed to write audit log:', err)
  }
}

/** Convenience: extract IP from request and call audit() */
export async function auditFromRequest(
  request: Request,
  gymId: string,
  userId: string,
  action: AuditAction,
  entityType: string,
  entityId?: string | null,
  meta?: any
): Promise<void> {
  const ip = getClientIp(request)
  return audit(gymId, userId, action, entityType, entityId, meta, ip)
}
