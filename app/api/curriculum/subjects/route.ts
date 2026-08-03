import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { DEFAULT_JURISDICTION } from '@/lib/curriculum-config'

export const dynamic = 'force-dynamic'

/** Forma de `SELECT DISTINCT materia`. `curriculum.materia` es TEXT NOT NULL — ver scripts/007-curriculum.sql. */
interface SubjectRow {
  materia: string
}

// GET /api/curriculum/subjects?nivel=Secundario&grado=1er+Año&jurisdiccion=Salta
// Returns the ordered list of unique materias for nivel+grado(+jurisdiccion).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const nivel = searchParams.get('nivel')?.trim()
  const grado = searchParams.get('grado')?.trim()
  const jurisdiccion = searchParams.get('jurisdiccion')?.trim() || DEFAULT_JURISDICTION

  if (!nivel || !grado) {
    return NextResponse.json({ error: 'Parámetros nivel y grado requeridos' }, { status: 400 })
  }

  try {
    const rows = (await sql`
      SELECT DISTINCT materia
      FROM curriculum
      WHERE nivel = ${nivel} AND grado = ${grado} AND jurisdiccion = ${jurisdiccion}
      ORDER BY materia
    `) as SubjectRow[]
    return NextResponse.json({ subjects: rows.map((r) => r.materia) })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener materias', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
