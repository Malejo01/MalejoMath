import { auth } from '@/auth'
import { NextResponse } from 'next/server'

// Routes that do NOT require authentication
const PUBLIC_PATHS = [
  '/',
  '/sign-in',
  '/sign-up',
  '/api/auth',         // NextAuth's own routes
  '/api/generate-quiz', // Public quiz generation (kept public as before)
  '/api/explain-error', // Public error explanation
]

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'))
}

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isAuthenticated = !!session

  if (!isAuthenticated && !isPublic(nextUrl.pathname)) {
    const signInUrl = new URL('/sign-in', nextUrl.origin)
    signInUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Authorize roles: block ALUMNO from teacher API and page endpoints
  if (isAuthenticated && session?.user?.role === 'ALUMNO') {
    const { pathname } = nextUrl
    if (pathname === '/api/teacher' || pathname.startsWith('/api/teacher/')) {
      return NextResponse.json(
        { error: 'Acceso denegado: Los alumnos no tienen permitido el acceso a endpoints de docente.' },
        { status: 403 }
      )
    }
    if (pathname === '/teacher' || pathname.startsWith('/teacher/')) {
      return NextResponse.redirect(new URL('/', nextUrl.origin))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
