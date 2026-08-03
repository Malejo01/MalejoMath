/**
 * Filtrado de datos personales antes de que un evento salga hacia Sentry.
 *
 * El caso que obliga a esto: un alumno entra a un aula como invitado tipeando
 * sólo su nombre. Ese nombre viaja en el body de `/api/classrooms/join`, queda
 * en `displayName` y reaparece en cualquier stack trace que serialice la
 * request. Son chicos, muchos de primaria, sin cuenta ni consentimiento — su
 * nombre no tiene por qué terminar en un servicio de terceros para que
 * nosotros veamos un error de parseo.
 *
 * El módulo es puro y sin dependencias del SDK justamente para poder testearlo:
 * un filtro de PII que nadie verifica es un filtro que no existe.
 */

export const REDACTED = '[Filtrado]'

/**
 * Claves cuyo valor se reemplaza siempre, sin importar dónde aparezcan. Se
 * comparan en minúsculas y sin guiones bajos, así `display_name`, `displayName`
 * y `DisplayName` caen todas en la misma entrada.
 */
const SENSITIVE_KEYS = new Set([
  'name',
  'displayname',
  'studentname',
  'guestname',
  'nombre',
  'apellido',
  'fullname',
  'email',
  'mail',
  'correo',
  // No son nombres, pero filtrarlos cuesta lo mismo y evita que un token o un
  // código de aula queden legibles en el panel de errores.
  'password',
  'token',
  'authorization',
  'cookie',
  'joincode',
  'codigo',
])

/** Profundidad máxima al recorrer objetos anidados; corta ciclos y payloads gigantes. */
const MAX_DEPTH = 6

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[-_\s]/g, '')
}

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(normalizeKey(key))
}

/**
 * Recorre un valor arbitrario y reemplaza el contenido de las claves sensibles.
 * Devuelve una copia: nunca muta lo que recibe, porque el mismo objeto puede
 * seguir en uso del lado de la aplicación.
 */
export function redactDeep(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return REDACTED
  if (value === null || typeof value !== 'object') return value

  if (Array.isArray(value)) {
    return value.map((item) => redactDeep(item, depth + 1))
  }

  const result: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    result[key] = isSensitiveKey(key) ? REDACTED : redactDeep(entry, depth + 1)
  }
  return result
}

/**
 * Un código de aula en la URL no es un dato personal, pero sí una credencial:
 * quien lo lee puede entrar al aula. Se normaliza a la forma de la ruta.
 */
export function redactUrl(url: string): string {
  return url
    .replace(/\/aula\/[^/?#]+/gi, '/aula/[codigo]')
    .replace(/([?&](?:name|nombre|email|codigo|code|token)=)[^&#]*/gi, `$1${REDACTED}`)
}

/**
 * Forma mínima de un evento de Sentry, con lo único que este módulo toca. Se
 * declara acá en vez de importar el tipo del SDK para que el archivo siga
 * siendo testeable sin arrastrar `@sentry/nextjs` al entorno de test.
 *
 * Dos detalles que parecen cosméticos y no lo son, porque de ellos depende que
 * `Event` de Sentry sea asignable a este tipo — y por lo tanto que `beforeSend`
 * typechequee de verdad en vez de vivir tapado por `ignoreBuildErrors`:
 *
 *  1. Nada de index signatures (`[key: string]: unknown`). Las interfaces de
 *     TypeScript NO reciben index signature implícita, así que un tipo que la
 *     exige jamás acepta una interfaz del SDK por más que las propiedades
 *     coincidan. Este tipo describe lo que el scrubber lee; las claves que no
 *     nombra viajan igual en runtime porque `scrubEvent` muta el objeto
 *     original y devuelve esa misma referencia.
 *  2. La nulabilidad tiene que ser igual de ancha que la del SDK: Sentry tipa
 *     `user.id` como `string | number` y deja pasar `null` en el resto. Cerrar
 *     eso acá no valida nada, sólo rompe la asignación.
 */
export interface ScrubbableEvent {
  request?: {
    url?: string
    query_string?: string | Record<string, string> | Array<[string, string]>
    data?: unknown
    headers?: Record<string, string>
    cookies?: unknown
  }
  user?: {
    id?: string | number
    username?: string | null
    email?: string | null
    ip_address?: string | null
  }
  extra?: Record<string, unknown>
  contexts?: Record<string, unknown>
  breadcrumbs?: Array<{ data?: unknown; message?: string }>
}

/**
 * Punto de entrada usado por `beforeSend` en las tres configuraciones (cliente,
 * servidor y edge).
 *
 * Del usuario se conserva sólo el `id`: es un UUID opaco, no dice quién es
 * nadie, y sin él se pierde la capacidad de ver si un error le pasa a una
 * persona o a doscientas. Nombre, email e IP se van.
 */
export function scrubEvent<T extends ScrubbableEvent>(event: T): T {
  if (event.request) {
    if (event.request.url) event.request.url = redactUrl(event.request.url)
    if (typeof event.request.query_string === 'string') {
      event.request.query_string = redactUrl(event.request.query_string)
    } else if (event.request.query_string) {
      event.request.query_string = redactDeep(event.request.query_string) as never
    }
    if (event.request.data !== undefined) {
      event.request.data = redactDeep(event.request.data)
    }
    if (event.request.headers) {
      event.request.headers = redactDeep(event.request.headers) as Record<string, string>
    }
    // Las cookies incluyen la de sesión de invitado, que es una credencial
    // válida: con ella se puede suplantar al alumno.
    if (event.request.cookies !== undefined) {
      event.request.cookies = REDACTED
    }
  }

  if (event.user) {
    event.user = { id: event.user.id }
  }

  if (event.extra) event.extra = redactDeep(event.extra) as Record<string, unknown>
  if (event.contexts) event.contexts = redactDeep(event.contexts) as Record<string, unknown>

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((crumb) => ({
      ...crumb,
      message: crumb.message ? redactUrl(crumb.message) : crumb.message,
      data: crumb.data === undefined ? undefined : redactDeep(crumb.data),
    }))
  }

  return event
}
