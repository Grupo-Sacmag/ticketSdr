import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL

export async function POST(request: Request) {
  const body = await request.json()

  const response = await fetch(
    `${BACKEND_URL}/api/auth/reenviar-codigo`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    }
  )

  const data = await response.text()

  return NextResponse.json(data, {
    status: response.status,
  })
}