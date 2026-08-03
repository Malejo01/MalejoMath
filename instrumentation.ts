import * as Sentry from '@sentry/nextjs'

/**
 * Punto de entrada de instrumentación de Next. Carga la configuración de
 * Sentry que corresponda al runtime: Node para los route handlers, edge para
 * `proxy.ts`. El bundle del navegador se inicializa aparte, desde
 * `instrumentation-client.ts`.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

/**
 * Captura los errores que Next deja escapar de un route handler o de un
 * componente de servidor. No alcanza por sí solo: casi todos los handlers de
 * este proyecto atrapan su propia excepción y responden un JSON con status 500,
 * y esos errores nunca llegan hasta acá. Por eso los `catch` relevantes llaman
 * explícitamente a los helpers de `lib/observability.ts`.
 */
export const onRequestError = Sentry.captureRequestError
