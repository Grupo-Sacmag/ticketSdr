import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const correo = searchParams.get('correo')

  const response = await fetch(
    `${BACKEND_URL}/api/auth/tiempo-codigo?correo=${encodeURIComponent(correo || '')}`,
    { cache: 'no-store' }
  )

  const data = await response.json()

  return NextResponse.json(data, {
    status: response.status,
  })
}