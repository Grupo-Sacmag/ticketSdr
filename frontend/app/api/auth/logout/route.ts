import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()

  cookieStore.delete('sacmag_token')
  cookieStore.delete('sacmag_session')

  return NextResponse.json({ ok: true })
}