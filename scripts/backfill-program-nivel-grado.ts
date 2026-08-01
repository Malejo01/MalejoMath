/**
 * Best-effort backfill of teacher_programs.nivel / .grado (migration 014).
 *
 * Before the subject wizard, a teacher's level lived as free text inside
 * pedagogy_profile ("Universitario", "1ro", "3er Año"...). This maps the
 * unambiguous cases onto the new columns and deliberately leaves everything
 * else NULL — the dashboard flags those programs and the wizard asks the
 * teacher on the next edit. Guessing wrong is worse than asking, because
 * stage 2 matches classrooms against these columns.
 *
 * Safe to re-run: only touches rows where nivel IS NULL.
 * Usage: npx tsx scripts/backfill-program-nivel-grado.ts [--apply]
 */
import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

type Nivel = 'Primario' | 'Secundario' | 'Superior'

const NIVEL_PATTERNS: { nivel: Nivel; patterns: RegExp }[] = [
  { nivel: 'Primario', patterns: /primari/i },
  { nivel: 'Secundario', patterns: /secundari|polimodal|nivel medio|escuela media|bachiller/i },
  { nivel: 'Superior', patterns: /superior|universi|terciari|profesorado|tecnicatura|instituto|facultad/i },
]

const PLACEHOLDER_VALUES = ['', 'no especificado', 'no aplica', '-', 'n/a', 'sin especificar']

function inferNivel(rawLevel: string): Nivel | null {
  const value = rawLevel.trim()
  if (!value) return null

  const matches = NIVEL_PATTERNS.filter((entry) => entry.patterns.test(value))
  // More than one match means the text is ambiguous ("terciario y secundario"),
  // so leave it for the teacher rather than picking one.
  return matches.length === 1 ? matches[0].nivel : null
}

function cleanGrado(rawGrado: string): string | null {
  const value = rawGrado.trim()
  return value && !PLACEHOLDER_VALUES.includes(value.toLowerCase()) ? value : null
}

async function run() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('DATABASE_URL no encontrada en .env.local')
    process.exit(1)
  }

  const apply = process.argv.includes('--apply')
  const sql = neon(dbUrl)

  const rows = (await sql`
    SELECT id, subject_name, pedagogy_profile, source_file_name
    FROM teacher_programs
    WHERE nivel IS NULL
    ORDER BY id
  `) as Record<string, any>[]

  if (rows.length === 0) {
    console.log('No hay materias pendientes de completar nivel/grado.')
    return
  }

  console.log(`${rows.length} materias sin nivel.${apply ? '' : ' (simulación: agregá --apply para escribir)'}\n`)

  let updated = 0
  let skipped = 0

  for (const row of rows) {
    const profile = (row.pedagogy_profile ?? {}) as { level?: string; academicYear?: string }
    const nivel = inferNivel(String(profile.level ?? ''))
    const grado = cleanGrado(String(profile.academicYear ?? ''))
    const createdFrom = row.source_file_name ? 'upload' : 'manual'

    if (!nivel) {
      skipped += 1
      console.log(`  ⏭  #${row.id} ${row.subject_name} — nivel "${profile.level ?? ''}" no es concluyente, queda para el docente`)
      continue
    }

    console.log(`  ✔  #${row.id} ${row.subject_name} → ${nivel}${grado ? ` · ${grado}` : ' (sin año)'}`)

    if (apply) {
      await sql`
        UPDATE teacher_programs
        SET nivel = ${nivel}, grado = ${grado}, created_from = ${createdFrom}, updated_at = NOW()
        WHERE id = ${row.id} AND nivel IS NULL
      `
    }
    updated += 1
  }

  console.log(`\n${apply ? 'Actualizadas' : 'Se actualizarían'}: ${updated} · Pendientes para el docente: ${skipped}`)
}

run().catch((err) => {
  console.error('❌ Error en el backfill:', err)
  process.exit(1)
})
