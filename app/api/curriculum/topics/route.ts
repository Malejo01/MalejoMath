import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/curriculum/topics?nivel=Secundario&grado=1er+Año&materia=Matemática
// Returns all ejes with their temas for the given nivel+grado+materia.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const nivel   = searchParams.get('nivel')?.trim()
  const grado   = searchParams.get('grado')?.trim()
  const materia = searchParams.get('materia')?.trim()

  if (!nivel || !grado || !materia) {
    return NextResponse.json({ error: 'Parámetros nivel, grado y materia requeridos' }, { status: 400 })
  }

  try {
    const rows = await sql`
      SELECT eje, temas
      FROM curriculum
      WHERE nivel   = ${nivel}
        AND grado   = ${grado}
        AND materia = ${materia}
      ORDER BY id
    `
    // temas is stored as JSONB (string[]); cast for TS safety
    const axes = rows.map((r) => ({
      eje:   r.eje as string,
      temas: r.temas as string[],
    }))
    return NextResponse.json({ axes })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener temas', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
