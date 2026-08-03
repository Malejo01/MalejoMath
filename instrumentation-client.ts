/**
 * Sentry — navegador. Next lo carga solo; no hay que importarlo desde ningún
 * lado.
 */
import * as Sentry from '@sentry/nextjs'
import { scrubEvent } from '@/lib/sentry-scrub'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),

  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  sendDefaultPii: false,
  tracesSampleRate: 0.1,

  // Session Replay queda apagado a propósito: graba el DOM, y el DOM de esta
  // app tiene nombres de alumnos, respuestas y notas. Encenderlo sería
  // exactamente lo que el filtro de PII viene a evitar.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  beforeSend: (event) => scrubEvent(event),
  beforeSendTransaction: (event) => scrubEvent(event),
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
