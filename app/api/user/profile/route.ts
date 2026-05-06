import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import type { UserRole } from '@/lib/types'

async function ensureProfile(userId: string) {
  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? ''
  const displayName = clerkUser?.firstName || clerkUser?.username || ''

  await sql`
    INSERT INTO users (id, email, display_name, role, created_at, updated_at)
    VALUES (${userId}, ${email}, ${displayName}, 'student', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      display_name = EXCLUDED.display_name,
      updated_at = NOW()
  `

  const rows = await sql`
    SELECT id, email, COALESCE(display_name, '') AS display_name, COALESCE(role, 'student') AS role
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `

  return rows[0]
}

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const profile = await ensureProfile(userId)
    return NextResponse.json({
      profile: {
        id: profile.id,
        email: profile.email,
        displayName: profile.display_name,
        role: profile.role as UserRole,
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
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const role = body?.role as UserRole

    if (role !== 'student' && role !== 'teacher') {
      return NextResponse.json({ error: 'Rol invalido' }, { status: 400 })
    }

    await ensureProfile(userId)

    const rows = await sql`
      UPDATE users
      SET role = ${role}, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, email, COALESCE(display_name, '') AS display_name, role
    `

    return NextResponse.json({
      profile: {
        id: rows[0].id,
        email: rows[0].email,
        displayName: rows[0].display_name,
        role: rows[0].role as UserRole,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'No se pudo actualizar el perfil', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
