/**
 * Repairs teacher_programs metadata that predates the subject wizard.
 *
 * Two fixes, both idempotent and safe to re-run:
 *
 * 1. grado — snaps "6", "sexto", "1ero" to the exact spelling the curriculum
 *    uses ("6to Año"). grado is the join key against the curriculum table, so
 *    a mismatched spelling silently leaves the teacher with an empty topic
 *    panel. New writes are normalized in the API (lib/grado-server.ts); this
 *    catches the rows written before that existed.
 *
 * 2. pedagogy_profile — the old upload form had a required free-text "Carrera"
 *    box and no nivel/grado fields, so teachers typed the year into it. That
 *    reached the AI prompt as "Carrera: 4to Año". pedagogyProfileToContext now
 *    filters this at read time; this also cleans it at rest so the stored data
 *    stops being misleading. academicYear is normalized to the canonical grado
 *    for the same reason.
 *
 * Usage: npx tsx scripts/repair-program-metadata.ts [--apply]
 */
import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import { canonicalGrado, extractGradoNumber } from '../lib/grado'

dotenv.config({ path: '.env.local' })

type Nivel = 'Primario' | 'Secundario' | 'Superior'

interface PedagogyProfile {
  level?: string
  degree?: string
  academicYear?: string
  complexity?: string
  assessmentStyle?: string
  methodology?: string
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** True when 'Carrera' is really just the year or the level said twice. */
function degreeIsRedundant(degree: string, academicYear: string, level: string): boolean {
  if (!degree.trim()) return false
  if (normalizeText(degree) === normalizeText(academicYear)) return true
  if (normalizeText(degree) === normalizeText(level)) return true

  const degreeYear = extractGradoNumber(degree)
  return degreeYear !== null && degreeYear === extractGradoNumber(academicYear)
}

async function run() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('DATABASE_URL no encontrada en .env.local')
    process.exit(1)
  }

  const apply = process.argv.includes('--apply')
  const sql = neon(dbUrl)

  // Curriculum spellings per nivel, so we snap to what the DB actually stores
  // rather than to our own guess.
  const curriculumRows = (await sql`
    SELECT DISTINCT nivel, grado FROM curriculum
  `) as { nivel: string; grado: string }[]

  const gradosByNivel = new Map<string, string[]>()
  for (const row of curriculumRows) {
    const list = gradosByNivel.get(row.nivel) ?? []
    list.push(row.grado)
    gradosByNivel.set(row.nivel, list)
  }

  function resolveGrado(nivel: string | null, raw: string | null): string | null {
    const trimmed = String(raw ?? '').trim()
    if (!trimmed) return null

    const canonical = canonicalGrado(trimmed)
    const options = nivel ? (gradosByNivel.get(nivel) ?? []) : []
    const number = extractGradoNumber(trimmed)

    const match =
      options.find((option) => option.toLowerCase() === canonical.toLowerCase()) ??
      (number ? options.find((option) => extractGradoNumber(option) === number) : undefined)

    return match ?? canonical
  }

  const programs = (await sql`
    SELECT id, subject_name, nivel, grado, pedagogy_profile
    FROM teacher_programs
    ORDER BY id
  `) as { id: number; subject_name: string; nivel: Nivel | null; grado: string | null; pedagogy_profile: PedagogyProfile }[]

  console.log(`${programs.length} materias.${apply ? '' : ' (simulación: agregá --apply para escribir)'}\n`)

  let changed = 0

  for (const program of programs) {
    const profile = program.pedagogy_profile ?? {}
    const nextGrado = resolveGrado(program.nivel, program.grado)

    const level = String(profile.level ?? '')
    const academicYear = resolveGrado(program.nivel, String(profile.academicYear ?? '')) ?? ''
    const degree = String(profile.degree ?? '')
    const nextDegree = degreeIsRedundant(degree, academicYear || nextGrado || '', level) ? 'No aplica' : degree

    const gradoChanged = nextGrado !== program.grado
    const yearChanged = academicYear !== String(profile.academicYear ?? '')
    const degreeChanged = nextDegree !== degree

    if (!gradoChanged && !yearChanged && !degreeChanged) continue

    changed += 1
    const notes: string[] = []
    if (gradoChanged) notes.push(`grado "${program.grado}" → "${nextGrado}"`)
    if (yearChanged) notes.push(`academicYear "${profile.academicYear}" → "${academicYear}"`)
    if (degreeChanged) notes.push(`carrera "${degree}" → "${nextDegree}" (repetía el año)`)
    console.log(`  #${program.id} ${program.subject_name}: ${notes.join(' · ')}`)

    if (apply) {
      const nextProfile = { ...profile, academicYear, degree: nextDegree }
      await sql`
        UPDATE teacher_programs
        SET grado = ${nextGrado}, pedagogy_profile = ${JSON.stringify(nextProfile)}, updated_at = NOW()
        WHERE id = ${program.id}
      `
    }
  }

  console.log(`\n${apply ? 'Materias corregidas' : 'Materias a corregir'}: ${changed} de ${programs.length}`)
}

run().catch((err) => {
  console.error('❌ Error en la reparación:', err)
  process.exit(1)
})
