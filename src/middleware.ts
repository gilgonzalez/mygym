import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { updateSession } from './lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/editor') || request.nextUrl.pathname.startsWith('/profile')) {
    const sessionResponse = await updateSession(request)
    const isRedirect = sessionResponse.headers.get('location')

    if (isRedirect) {
      return sessionResponse
    }

    return sessionResponse
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
