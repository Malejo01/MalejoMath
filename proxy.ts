import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { isAdminEmail } from '@/lib/ai-rate-limit'

// Routes that do NOT require a NextAuth session.
//
// The aula routes are listed here because a guest student has no NextAuth
// session at all — they carry a signed guest cookie instead. Each of those
// handlers resolves the viewer itself (getViewer) and answers 401 when there
// is neither identity, so "public" here means "the middleware must not bounce
// them to /sign-in", not "unauthenticated access allowed".
//
// Los cuatro endpoints de IA de esta lista pasan además por guardAiCall
// (lib/ai-guard.ts), que exige identidad antes de tocar Gemini. Hasta la
// migración 016 tres de ellos no verificaban absolutamente nada: cualquiera
// con curl podía quemar la cuota. Si agregás un endpoint de IA acá, cableá el
// guard en el handler o volvés a abrir ese agujero.
const PUBLIC_PATHS = [
  '/',
  '/sign-in',
  '/sign-up',
  '/api/auth',            // NextAuth's own routes
  '/api/generate-quiz',   // Guests generate inside an aula
  '/api/explain-error',   // Explicación del error tras responder mal
  '/aula',                // Join-by-code page
  '/aulas',               // "Mis aulas"
  '/api/classrooms',      // Join endpoint
  '/api/student',         // Student-side aula endpoints
  '/api/quiz/save-result',      // Guests submit attempts too
  '/api/quiz/grade-short-answer',
  '/api/quiz/revancha',   // Se dispara desde la pantalla de resultados
  '/api/feedback',        // Reportar un problema (el invitado también reporta)
  '/monitoring',          // Túnel de Sentry (tunnelRoute en next.config.mjs)
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

  // /admin no se protege por rol sino por la allowlist ADMIN_EMAILS: no existe
  // un rol ADMIN en el producto. Esto es defensa en profundidad — la página y
  // la ruta ya chequean con getAdminViewer() — y evita además que un no-admin
  // llegue siquiera a ejecutar el handler.
  if (isAuthenticated) {
    const { pathname } = nextUrl
    const isAdminPath =
      pathname === '/admin' ||
      pathname.startsWith('/admin/') ||
      pathname === '/api/admin' ||
      pathname.startsWith('/api/admin/')

    if (isAdminPath && !isAdminEmail(session?.user?.email)) {
      return NextResponse.redirect(new URL('/', nextUrl.origin))
    }
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
