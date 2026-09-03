import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BACKEND_URL = process.env.BACKEND_URL

export async function PUT(request: Request) {
  const cookieStore = await cookies()

  const token = cookieStore.get('sacmag_token')?.value
  const sessionCookie = cookieStore.get('sacmag_session')?.value

  if (!token) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    )
  }

  const body = await request.json()

  const response = await fetch(
    `${BACKEND_URL}/api/auth/cambiar-password`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    }
  )

  const contentType = response.headers.get('content-type')

  const data = contentType?.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    return NextResponse.json(data, {
      status: response.status,
    })
  }

  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie)

      cookieStore.set(
        'sacmag_session',
        JSON.stringify({
          ...session,
          passwordTemporal: false,
        }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 8,
        }
      )
    } catch {
      // La sesión se regenerará en el próximo login.
    }
  }

  return NextResponse.json(data)
}