import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL

type Context = {
  params: Promise<{
    path: string[]
  }>
}

async function proxyRequest(
  request: NextRequest,
  context: Context
) {
  const cookieStore = await cookies()
  const token = cookieStore.get('sacmag_token')?.value

  if (!token) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    )
  }

  const { path } = await context.params

  const destino = new URL(
    `/api/${path.join('/')}`,
    BACKEND_URL
  )

  request.nextUrl.searchParams.forEach((value, key) => {
    destino.searchParams.append(key, value)
  })

  const headers = new Headers()

  const contentType = request.headers.get('content-type')

  if (contentType) {
    headers.set('Content-Type', contentType)
  }

  headers.set('Authorization', `Bearer ${token}`)

  const method = request.method

  let body: ArrayBuffer | undefined

  if (method !== 'GET' && method !== 'HEAD') {
    body = await request.arrayBuffer()
  }

  try {
    const backendResponse = await fetch(destino, {
      method,
      headers,
      body,
      cache: 'no-store',
    })

    const responseBody = await backendResponse.arrayBuffer()

    if (backendResponse.status === 401) {
          cookieStore.delete('sacmag_token')
          cookieStore.delete('sacmag_session')
        }

    const responseHeaders = new Headers()

    const responseContentType =
      backendResponse.headers.get('content-type')

    if (responseContentType) {
      responseHeaders.set(
        'Content-Type',
        responseContentType
      )
    }

    const contentDisposition =
      backendResponse.headers.get('content-disposition')

    if (contentDisposition) {
      responseHeaders.set(
        'Content-Disposition',
        contentDisposition
      )
    }

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('Error proxy Next → Spring:', error)

    return NextResponse.json(
      { error: 'No se pudo comunicar con el backend' },
      { status: 502 }
    )
  }
}

export const GET = proxyRequest
export const POST = proxyRequest
export const PUT = proxyRequest
export const DELETE = proxyRequest
export const PATCH = proxyRequest