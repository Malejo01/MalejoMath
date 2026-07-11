import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/curriculum/subjects?nivel=Secundario&grado=1er+Año
// Returns the ordered list of unique materias for nivel+grado.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const nivel = searchParams.get('nivel')?.trim()
  const grado = searchParams.get('grado')?.trim()

  if (!nivel || !grado) {
    return NextResponse.json({ error: 'Parámetros nivel y grado requeridos' }, { status: 400 })
  }

  try {
    const rows = await sql`
      SELECT DISTINCT materia
      FROM curriculum
      WHERE nivel = ${nivel} AND grado = ${grado}
      ORDER BY materia
    `
    return NextResponse.json({ subjects: rows.map((r) => r.materia) })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener materias', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
