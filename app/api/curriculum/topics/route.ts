import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { DEFAULT_JURISDICTION } from '@/lib/curriculum-config'

export const dynamic = 'force-dynamic'

/**
 * Forma de `SELECT eje, temas` — ver scripts/007-curriculum.sql.
 *
 * `temas` queda `unknown` a propósito. Es una columna JSONB: Postgres garantiza
 * que el contenido es JSON válido, no que sea un arreglo de strings. Declararla
 * `string[]` sería trasladar la mentira del `as` al tipo, que es justo lo que
 * hacía fallar esto en silencio.
 */
interface AxisRow {
  eje: string
  temas: unknown
}

/**
 * Estrecha el JSONB al contrato que espera el front. Lo que no es un arreglo de
 * strings se descarta acá, donde se puede ver, en vez de llegar al browser y
 * romper el `.map`/`.join` que lo consume.
 */
function toTopicList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

// GET /api/curriculum/topics?nivel=Secundario&grado=1er+Año&materia=Matemática&jurisdiccion=Salta
// Returns all ejes with their temas for the given nivel+grado+materia(+jurisdiccion).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const nivel   = searchParams.get('nivel')?.trim()
  const grado   = searchParams.get('grado')?.trim()
  const materia = searchParams.get('materia')?.trim()
  const jurisdiccion = searchParams.get('jurisdiccion')?.trim() || DEFAULT_JURISDICTION

  if (!nivel || !grado || !materia) {
    return NextResponse.json({ error: 'Parámetros nivel, grado y materia requeridos' }, { status: 400 })
  }

  try {
    const rows = (await sql`
      SELECT eje, temas
      FROM curriculum
      WHERE nivel   = ${nivel}
        AND grado   = ${grado}
        AND materia = ${materia}
        AND jurisdiccion = ${jurisdiccion}
      ORDER BY id
    `) as AxisRow[]
    const axes = rows.map((r) => ({
      eje:   r.eje,
      temas: toTopicList(r.temas),
    }))
    return NextResponse.json({ axes })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener temas', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
