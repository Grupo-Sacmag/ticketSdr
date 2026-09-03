import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BACKEND_URL = process.env.BACKEND_URL

export async function POST(request: Request) {
  const body = await request.json()

  const response = await fetch(`${BACKEND_URL}/api/auth/verificar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  const contentType = response.headers.get('content-type')
  const data = contentType?.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok || typeof data === 'string') {
    return NextResponse.json(data, { status: response.status })
  }

  const cookieStore = await cookies()

  cookieStore.set('sacmag_token', data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  cookieStore.set(
    'sacmag_session',
    JSON.stringify({
      nombre: data.nombre,
      correo: data.correo,
      rol: data.rol,
      passwordTemporal: data.passwordTemporal,
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    }
  )

  return NextResponse.json({
    nombre: data.nombre,
    correo: data.correo,
    rol: data.rol,
    passwordTemporal: data.passwordTemporal,
  })
}