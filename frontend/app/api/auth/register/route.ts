import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    const contentType = response.headers.get('content-type')

    const data = contentType?.includes('application/json')
      ? await response.json()
      : await response.text()

    return NextResponse.json(data, {
      status: response.status,
    })
  } catch {
    return NextResponse.json(
      { error: 'No se pudo comunicar con el servidor' },
      { status: 500 }
    )
  }
}