import { sql } from '@/lib/db'
import { DEFAULT_JURISDICTION } from '@/lib/curriculum-config'
import { canonicalGrado, extractGradoNumber } from '@/lib/grado'
import type { Nivel } from '@/lib/types'

/**
 * Server-side resolution: canonicalize, then prefer the exact string the
 * curriculum stores for that nivel so equality joins keep working even if the
 * seeder ever uses a different wording ("6to Grado", say).
 */
export async function resolveGradoForNivel(
  nivel: Nivel | null,
  rawGrado: string | null,
  jurisdiccion: string = DEFAULT_JURISDICTION
): Promise<string | null> {
  const trimmed = String(rawGrado ?? '').trim()
  if (!trimmed) return null

  const canonical = canonicalGrado(trimmed)
  if (!nivel) return canonical

  try {
    const rows = (await sql`
      SELECT DISTINCT grado
      FROM curriculum
      WHERE nivel = ${nivel} AND jurisdiccion = ${jurisdiccion}
    `) as { grado: string }[]

    const number = extractGradoNumber(trimmed)

    const match =
      rows.find((row) => row.grado.toLowerCase() === canonical.toLowerCase()) ??
      // Fall back to matching by the year number, so "6to Grado" in the DB
      // still wins over our "6to Año" guess.
      (number ? rows.find((row) => extractGradoNumber(row.grado) === number) : undefined)

    return match?.grado ?? canonical
  } catch {
    // Curriculum unavailable (un-seeded DB, transient error): the canonical
    // string is still better than the raw input.
    return canonical
  }
}
