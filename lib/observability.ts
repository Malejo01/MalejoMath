/**
 * Captura explícita de errores hacia Sentry.
 *
 * `onRequestError` (instrumentation.ts) sólo ve las excepciones que escapan de
 * un route handler, y en este proyecto casi ninguna lo hace: los handlers
 * atrapan, loguean por consola y responden un JSON con status 500. Desde afuera
 * eso es indistinguible de un 200 — el error existe pero nadie se entera. Estos
 * helpers son la forma de que sí se enteren, con tags consistentes para poder
 * filtrar en el panel.
 *
 * Cada helper cubre una de las tres prioridades definidas para el lanzamiento:
 * fallas de esquema de Gemini, errores de endpoints, y parseo de archivos.
 */
import * as Sentry from '@sentry/nextjs'

/** Nunca dejar que un fallo del reporte tape al error que se estaba reportando. */
function safeCapture(error: unknown, configure: (scope: Sentry.Scope) => void): void {
  try {
    Sentry.withScope((scope) => {
      configure(scope)
      Sentry.captureException(error instanceof Error ? error : new Error(String(error)))
    })
  } catch (reportingError) {
    console.error('[observability] no se pudo reportar el error', reportingError)
  }
}

/**
 * Gemini devolvió algo que no encaja en el esquema Zod de `generateObject`.
 *
 * Es el error más caro del sistema y el más invisible: casi todos los llamadores
 * tienen un fallback (reintento con generateText, o parseo heurístico), así que
 * el usuario recibe un resultado degradado sin que nada falle a la vista. Si
 * esto sube de golpe, algo cambió en el modelo o en el prompt.
 */
export function captureAiSchemaFailure(
  error: unknown,
  context: {
    endpoint: string
    /** Camino que se tomó al fallar, para saber si el usuario notó algo. */
    fallback: 'generateText' | 'heuristic' | 'none'
    model?: string
    nivel?: string | null
    subject?: string | null
  }
): void {
  safeCapture(error, (scope) => {
    scope.setLevel('warning')
    scope.setTag('error_kind', 'ai_schema')
    scope.setTag('ai_endpoint', context.endpoint)
    scope.setTag('ai_fallback', context.fallback)
    scope.setTag('ai_model', context.model ?? 'gemini-2.5-flash')
    // Sin texto libre del alumno: sólo la forma del pedido, que es lo que hace
    // falta para reproducirlo.
    scope.setContext('generacion', {
      nivel: context.nivel ?? null,
      materia: context.subject ?? null,
    })
  })
}

/**
 * Un handler atrapó su propia excepción y va a responder un 4xx/5xx. Se usa en
 * `/api/teacher/*` y `/api/quiz/*`, que son los que sostienen las dos
 * experiencias con datos reales de por medio.
 */
export function captureRouteFailure(
  error: unknown,
  context: { endpoint: string; status?: number; operation?: string }
): void {
  safeCapture(error, (scope) => {
    scope.setLevel(context.status && context.status < 500 ? 'warning' : 'error')
    scope.setTag('error_kind', 'route')
    scope.setTag('endpoint', context.endpoint)
    if (context.operation) scope.setTag('operation', context.operation)
    if (context.status) scope.setContext('respuesta', { status: context.status })
  })
}

/**
 * Falló la extracción de texto de un archivo subido por un docente.
 *
 * Cada formato tiene su propia librería y sus propios modos de romperse (un PDF
 * escaneado, un .doc de Word 97, un OCR que no encuentra texto). El tag por
 * parser es lo que permite ver si el problema es de un formato puntual antes de
 * ponerse a adivinar.
 *
 * El nombre del archivo NO se manda: suele ser "Programa 3ro B - Prof Gonzalez.pdf".
 */
export function captureFileParsingFailure(
  error: unknown,
  context: {
    parser: 'mammoth' | 'pdf-parse' | 'tesseract' | 'word-extractor'
    mimeType?: string
    sizeBytes?: number
  }
): void {
  safeCapture(error, (scope) => {
    scope.setLevel('warning')
    scope.setTag('error_kind', 'file_parsing')
    scope.setTag('parser', context.parser)
    if (context.mimeType) scope.setTag('mime_type', context.mimeType)
    scope.setContext('archivo', {
      mimeType: context.mimeType ?? null,
      sizeBytes: context.sizeBytes ?? null,
    })
  })
}
