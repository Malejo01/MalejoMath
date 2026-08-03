/**
 * Sentry — runtime edge. En este proyecto es donde corre `proxy.ts`, el
 * middleware que protege rutas: si ahí se rompe algo, nadie entra a la app.
 * Se carga desde `instrumentation.ts`.
 */
import * as Sentry from '@sentry/nextjs'
import { scrubEvent } from '@/lib/sentry-scrub'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),

  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  sendDefaultPii: false,
  tracesSampleRate: 0.1,

  beforeSend: (event) => scrubEvent(event),
  beforeSendTransaction: (event) => scrubEvent(event),
})
