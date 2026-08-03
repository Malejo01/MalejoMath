import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * These cover the one property the whole guardrail rests on: how it behaves when
 * it CANNOT read the `deployment_env` marker.
 *
 * The dangerous direction is asymmetric. Treating production as staging is how a
 * destructive script runs against real data; treating staging as production only
 * costs an unnecessary confirmation prompt. So every unreadable answer has to
 * collapse to "production" — but only for the one error that genuinely means
 * "the table isn't there yet". A connection or permission failure that quietly
 * became "looks like production" would be worse than a crash: it would make the
 * guardrail report a confident answer it never actually obtained.
 *
 * The scenario that motivated this: migration 016 runs the guardrail, but the
 * marker table is only created by migration 017. Running them in numeric order
 * means 016 asks for a table that does not exist yet.
 */

/** Stands in for the tagged-template client that `neon(url)` returns. */
const query = vi.fn()

vi.mock('@neondatabase/serverless', () => ({
  neon: () => query,
}))

/** Postgres surfaces failures through `code`; NeonDbError re-exposes it verbatim. */
function pgError(message: string, code: string): Error {
  return Object.assign(new Error(message), { code })
}

const PROBE_URL = 'postgres://user:pass@probe-host.neon.tech/db'

let originalUrl: string | undefined
let warn: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  originalUrl = process.env.DATABASE_URL
  // dotenv does not override an already-set variable, so this survives
  // resolveDbTarget loading .env.local and keeps the test hermetic.
  process.env.DATABASE_URL = PROBE_URL
  query.mockReset()
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  if (originalUrl === undefined) delete process.env.DATABASE_URL
  else process.env.DATABASE_URL = originalUrl
  vi.restoreAllMocks()
})

describe('resolveDbTarget sin marcador de entorno', () => {
  it('trata una base sin la tabla deployment_env como producción, con aviso', async () => {
    query.mockRejectedValue(pgError('relation "deployment_env" does not exist', '42P01'))

    const { resolveDbTarget } = await import('./db-target')
    const target = await resolveDbTarget({ action: 'probe', destructive: false })

    expect(target.environment).toBe('production')
    expect(target.isRealProduction).toBe(true)
    // El aviso tiene que nombrar la migración que falta, o el operador no sabe
    // qué correr para salir del estado.
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('017'))
  })

  it('trata la tabla vacía igual que la tabla ausente', async () => {
    // Una 017 a medio aplicar (tabla creada, INSERT no corrido) deja este caso.
    // No hay marcador que leer, así que la respuesta segura es la misma.
    query.mockResolvedValue([])

    const { resolveDbTarget } = await import('./db-target')
    const target = await resolveDbTarget({ action: 'probe', destructive: false })

    expect(target.environment).toBe('production')
    expect(target.isRealProduction).toBe(true)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('017'))
  })

  it('propaga un error que no sea "tabla inexistente" en vez de asumir producción', async () => {
    // 28P01 = invalid_password. Nunca llegamos a leer el marcador, así que
    // devolver "producción" sería inventar una respuesta que no tenemos.
    query.mockRejectedValue(pgError('password authentication failed', '28P01'))

    const { resolveDbTarget } = await import('./db-target')

    await expect(resolveDbTarget({ action: 'probe', destructive: false })).rejects.toThrow(
      /password authentication failed/,
    )
  })
})
