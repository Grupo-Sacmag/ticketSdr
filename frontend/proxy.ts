import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const token = request.cookies.get('sacmag_token')?.value
  const sessionCookie = request.cookies.get('sacmag_session')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (sessionCookie && request.nextUrl.pathname !== '/cambiar-password') {
    try {
      const session = JSON.parse(sessionCookie)

      if (session.passwordTemporal) {
        return NextResponse.redirect(
          new URL('/cambiar-password', request.url)
        )
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/reportar/:path*',
    '/mis-tickets/:path*',
    '/tickets/:path*',
    '/cambiar-password/:path*',
    '/admin/:path*',
  ],
}