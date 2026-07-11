import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import type { UserRole } from '@/lib/types'

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id ?? null

  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    // User row was upserted at sign-in time by auth.ts; just fetch it.
    const rows = await sql`
      SELECT id, email, name, role, is_onboarded
      FROM users
      WHERE id = ${userId}
      LIMIT 1
    `

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      profile: {
        id: rows[0].id,
        email: rows[0].email,
        displayName: rows[0].name ?? '',
        role: (rows[0].role ?? null) as UserRole | null,
        isOnboarded: rows[0].is_onboarded,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'No se pudo obtener el perfil', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  const session = await auth()
  const userId = session?.user?.id ?? null

  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const role = body?.role as string

    if (role !== 'ALUMNO' && role !== 'DOCENTE') {
      return NextResponse.json({ error: 'Rol inválido. Debe ser ALUMNO o DOCENTE.' }, { status: 400 })
    }

    const rows = await sql`
      UPDATE users
      SET role = ${role}, is_onboarded = true, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, email, name, role, is_onboarded
    `

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      profile: {
        id: rows[0].id,
        email: rows[0].email,
        displayName: rows[0].name ?? '',
        role: rows[0].role as UserRole,
        isOnboarded: rows[0].is_onboarded,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'No se pudo actualizar el perfil', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

