import { sql } from '@/lib/db'
import type { SubjectColorName, SubjectIconName } from '@/lib/types'
import { slugifySubject } from '@/lib/subject-slug'

export { slugifySubject, sanitizeSubjectSegment } from '@/lib/subject-slug'

export interface SubjectMeta {
  displayName: string
  iconName: SubjectIconName
  colorName: SubjectColorName
  nivel: string | null
  source: 'curriculum' | 'teacher'
}

function rowToMeta(row: Record<string, unknown>): SubjectMeta {
  return {
    displayName: String(row.display_name),
    iconName: row.icon_name as SubjectIconName,
    colorName: row.color_name as SubjectColorName,
    nivel: (row.nivel as string | null) ?? null,
    source: row.source as 'curriculum' | 'teacher',
  }
}

export async function resolveSubjectMeta(nameOrSlug: string): Promise<SubjectMeta | null> {
  const slug = slugifySubject(nameOrSlug)
  const rows = (await sql`
    SELECT display_name, icon_name, color_name, nivel, source
    FROM subjects
    WHERE slug = ${slug}
    LIMIT 1
  `) as Record<string, unknown>[]
  return rows.length > 0 ? rowToMeta(rows[0]) : null
}

/**
 * Batch lookup keyed by the ORIGINAL name/string passed in (not the slug),
 * so callers can map results straight back onto the strings they already have
 * (e.g. quiz_attempts.subject values) without re-deriving slugs.
 */
export async function resolveSubjectMetaBatch(names: string[]): Promise<Record<string, SubjectMeta | null>> {
  const uniqueNames = Array.from(new Set(names.filter((name) => name && name.trim().length > 0)))
  if (uniqueNames.length === 0) return {}

  const slugs = uniqueNames.map(slugifySubject)
  const rows = (await sql`
    SELECT slug, display_name, icon_name, color_name, nivel, source
    FROM subjects
    WHERE slug = ANY(${slugs})
  `) as Record<string, unknown>[]
  const bySlug = new Map<string, SubjectMeta>(
    rows.map((row): [string, SubjectMeta] => [String(row.slug), rowToMeta(row)])
  )

  const result: Record<string, SubjectMeta | null> = {}
  uniqueNames.forEach((name) => {
    result[name] = bySlug.get(slugifySubject(name)) ?? null
  })
  return result
}

export async function upsertTeacherSubject(params: {
  programId: number
  subjectName: string
  iconName: SubjectIconName
  colorName: SubjectColorName
}): Promise<void> {
  const slug = `teacher-${params.programId}-${slugifySubject(params.subjectName)}`

  await sql`
    INSERT INTO subjects (slug, display_name, source, icon_name, color_name, teacher_program_id)
    VALUES (${slug}, ${params.subjectName}, 'teacher', ${params.iconName}, ${params.colorName}, ${params.programId})
    ON CONFLICT (slug) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      icon_name = EXCLUDED.icon_name,
      color_name = EXCLUDED.color_name,
      updated_at = NOW()
  `
}
