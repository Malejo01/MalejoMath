/**
 * Sentry — runtime Node.js (route handlers, server components, server actions).
 * Se carga desde `instrumentation.ts`.
 */
import * as Sentry from '@sentry/nextjs'
import { scrubEvent } from '@/lib/sentry-scrub'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Sin DSN el SDK queda inerte, así que en local no hace falta configurar nada.
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),

  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Falso explícito, aunque ya sea el default: es la línea que impide que el
  // SDK adjunte IPs y headers de usuario por su cuenta. Ver lib/sentry-scrub.ts.
  sendDefaultPii: false,

  // Los errores importan; las trazas de performance todavía no. Un 10 % alcanza
  // para ver si una ruta se degradó, sin gastar cuota antes del lanzamiento.
  tracesSampleRate: 0.1,

  integrations: [
    // Casi todos los handlers de /api/teacher/* y /api/quiz/* atrapan su propia
    // excepción, hacen console.error y responden un 500 en JSON. Esos errores
    // nunca llegan a onRequestError, así que sin esto quedarían invisibles: son
    // unas treinta rutas. Enganchar console.error las cubre a todas de una vez,
    // y a las que se escriban después. Los casos donde hacen falta tags
    // estructurados (esquema de Gemini, parseo de archivos) siguen reportándose
    // explícitamente desde lib/observability.ts.
    Sentry.captureConsoleIntegration({ levels: ['error'] }),
  ],

  beforeSend: (event) => scrubEvent(event),
  beforeSendTransaction: (event) => scrubEvent(event),
})
