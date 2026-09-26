import { NextResponse } from 'next/server'
import { MEMBER_SESSION_COOKIE } from '@/lib/member-auth'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete(MEMBER_SESSION_COOKIE)
  return response
}
