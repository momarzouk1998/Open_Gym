import { NextResponse } from 'next/server'
import { getGymContextApi } from '@/lib/gym-context'
import { prisma } from '@/lib/prisma'
import { auditFromRequest } from '@/lib/audit'
import { generateGymBarcode, generateAttendanceUrl } from '@/lib/barcode'

// GET /api/gyms/[gymSlug]/barcode
export async function GET(
  request: Request,
  { params }: { params: Promise<{ gymSlug: string }> }
) {
  const { gymSlug } = await params
  const ctxResult = await getGymContextApi(gymSlug)
  if (!ctxResult.ok) {
    return NextResponse.json({ error: ctxResult.error }, { status: ctxResult.status })
  }
  const { gym } = ctxResult.ctx

  try {
    const attendanceUrl = generateAttendanceUrl(gym.slug)
    
    return NextResponse.json({
      success: true,
      gym: {
        id: gym.id,
        name: gym.name,
        slug: gym.slug,
        gymBarcode: gym.gymBarcode,
        attendanceUrl,
      },
    })
  } catch (error) {
    console.error('Barcode fetch error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب بيانات الباركود' },
      { status: 500 }
    )
  }
}

// POST /api/gyms/[gymSlug]/barcode
export async function POST(
  request: Request,
  { params }: { params: Promise<{ gymSlug: string }> }
) {
  const { gymSlug } = await params
  const ctxResult = await getGymContextApi(gymSlug)
  if (!ctxResult.ok) {
    return NextResponse.json({ error: ctxResult.error }, { status: ctxResult.status })
  }
  const { gym, role, userId } = ctxResult.ctx

  // Only owner/manager can regenerate barcode
  if (role === 'cashier' || role === 'trainer') {
    return NextResponse.json({ error: 'لا تملك صلاحية تغيير الباركود' }, { status: 403 })
  }

  try {
    // Generate new barcode
    const newBarcode = generateGymBarcode(gym.name)

    // Update gym with new barcode
    const updated = await prisma.gym.update({
      where: { id: gym.id },
      data: { gymBarcode: newBarcode },
      select: { id: true, name: true, gymBarcode: true },
    })

    // Audit
    void auditFromRequest(request, gym.id, userId, 'gym.barcode_regenerate', 'gym', gym.id, {
      oldBarcode: gym.gymBarcode,
      newBarcode: newBarcode,
    })

    return NextResponse.json({ 
      success: true, 
      gym: updated,
      message: 'تم توليد باركود جديد بنجاح' 
    })
  } catch (error) {
    console.error('Barcode regeneration error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء توليد الباركود الجديد' },
      { status: 500 }
    )
  }
}