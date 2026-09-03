import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()

  const token = cookieStore.get('sacmag_token')
  const sessionCookie = cookieStore.get('sacmag_session')

  if (!token || !sessionCookie) {
    return NextResponse.json(
      { autenticado: false },
      { status: 401 }
    )
  }

  try {
    const usuario = JSON.parse(sessionCookie.value)

    return NextResponse.json({
      autenticado: true,
      usuario,
    })
  } catch {
    return NextResponse.json(
      { autenticado: false },
      { status: 401 }
    )
  }
}