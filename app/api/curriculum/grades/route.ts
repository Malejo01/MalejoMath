import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/curriculum/grades?nivel=Secundario
// Returns the ordered list of unique grados for a given nivel.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const nivel = searchParams.get('nivel')?.trim()

  if (!nivel) {
    return NextResponse.json({ error: 'Parámetro nivel requerido' }, { status: 400 })
  }

  try {
    const rows = await sql`
      SELECT DISTINCT grado
      FROM curriculum
      WHERE nivel = ${nivel}
      ORDER BY grado
    `
    return NextResponse.json({ grades: rows.map((r) => r.grado) })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener grados', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
