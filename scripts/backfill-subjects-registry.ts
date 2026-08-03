import { resolveDbTarget, type Sql } from './lib/db-target'
/**
 * scripts/backfill-subjects-registry.ts
 *
 * One-time backfill: creates a `subjects` registry row (source='curriculum')
 * for every distinct (materia, nivel) pair already present in the `curriculum`
 * table, so history/dashboard views can resolve icon/color metadata for
 * official curriculum subjects without a hardcoded list.
 *
 * Requires migration 010 (scripts/010-subjects-registry.sql) to have run first.
 *
 * Usage:  npx tsx scripts/backfill-subjects-registry.ts
 */


// Asignado al inicio de run(), una vez que el guardrail confirmó el destino.
let sql!: Sql

const COMBINING_MARK_MIN = 0x0300
const COMBINING_MARK_MAX = 0x036f

function stripDiacritics(value: string): string {
  return Array.from(value)
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0
      return code < COMBINING_MARK_MIN || code > COMBINING_MARK_MAX
    })
    .join('')
}

function slugifySubject(value: string): string {
  const cleaned = stripDiacritics(value.normalize('NFD'))
    .replace(/[^a-zA-Z0-9\s_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned) return 'sin-categoria'

  return cleaned
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function run() {
  ;({ sql } = await resolveDbTarget({ action: 'backfill del registro de materias' }))

  console.log('Sembrando registro de materias desde curriculum...')

  const distinctSubjects = await sql`
    SELECT DISTINCT materia, nivel FROM curriculum ORDER BY nivel, materia
  `

  if (distinctSubjects.length === 0) {
    console.log('No hay filas en curriculum todavia — nada para sembrar.')
    return
  }

  let inserted = 0
  let skipped = 0

  for (const row of distinctSubjects) {
    const materia = String(row.materia)
    const nivel = String(row.nivel)
    // Slug is derived from the subject NAME ONLY (matching lib/subjects.ts's
    // resolveSubjectMeta, which only ever has the free-text subject string to
    // work with — e.g. quiz_attempts.subject never carries a nivel alongside
    // it). If the same materia name appears at more than one nivel, the first
    // one wins here; this registry is purely display metadata (icon/color),
    // not authoritative curriculum content, so that's an acceptable tradeoff.
    const slug = slugifySubject(materia)

    const result = await sql`
      INSERT INTO subjects (slug, display_name, source, nivel)
      VALUES (${slug}, ${materia}, 'curriculum', ${nivel})
      ON CONFLICT (slug) DO NOTHING
      RETURNING id
    `

    if (result.length > 0) {
      inserted += 1
    } else {
      skipped += 1
    }
  }

  console.log(`Listo. ${inserted} materias nuevas registradas, ${skipped} ya existian.`)
}

run().catch((err) => {
  console.error('Error en el backfill:', err)
  process.exit(1)
})
