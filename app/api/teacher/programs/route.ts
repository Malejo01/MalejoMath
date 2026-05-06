import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import type { PedagogyProfile, ProgramUnit } from '@/lib/types'

function isTeacherRole(role: unknown): role is 'teacher' {
  return role === 'teacher'
}

async function requireTeacher(userId: string) {
  const rows = await sql`
    SELECT COALESCE(role, 'student') AS role
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `

  if (rows.length === 0) {
    return false
  }

  return isTeacherRole(rows[0].role)
}

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const isTeacher = await requireTeacher(userId)
    if (!isTeacher) {
      return NextResponse.json({ programs: [] })
    }

    const programs = await sql`
      SELECT id, user_id, subject_name, pedagogy_profile, units, source_file_name, created_at
      FROM teacher_programs
      WHERE user_id = ${userId} AND status = 'active'
      ORDER BY created_at DESC
    `

    return NextResponse.json({ programs })
  } catch (error) {
    return NextResponse.json(
      { error: 'No se pudieron obtener los programas', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const isTeacher = await requireTeacher(userId)
    if (!isTeacher) {
      return NextResponse.json({ error: 'Solo docentes pueden crear programas' }, { status: 403 })
    }

    const body = await req.json()
    const subjectName = String(body?.subjectName ?? '').trim()
    const units = body?.units as ProgramUnit[]
    const pedagogyProfile = body?.pedagogyProfile as PedagogyProfile
    const sourceFileName = body?.sourceFileName ? String(body.sourceFileName) : null
    const sourceMimeType = body?.sourceMimeType ? String(body.sourceMimeType) : null
    const sourceFileSizeBytes = body?.sourceFileSizeBytes ? Number(body.sourceFileSizeBytes) : null

    if (!subjectName) {
      return NextResponse.json({ error: 'La materia es obligatoria' }, { status: 400 })
    }

    if (!Array.isArray(units) || units.length === 0) {
      return NextResponse.json({ error: 'Debes definir al menos una unidad' }, { status: 400 })
    }

    const requiredPedagogy = [
      pedagogyProfile?.level,
      pedagogyProfile?.degree,
      pedagogyProfile?.academicYear,
      pedagogyProfile?.complexity,
      pedagogyProfile?.assessmentStyle,
      pedagogyProfile?.methodology,
    ]

    if (requiredPedagogy.some((value) => !value || String(value).trim().length === 0)) {
      return NextResponse.json({ error: 'Completa todos los campos pedagogicos obligatorios' }, { status: 400 })
    }

    const rows = await sql`
      INSERT INTO teacher_programs (
        user_id,
        subject_name,
        pedagogy_profile,
        units,
        source_file_name,
        source_mime_type,
        source_file_size_bytes,
        source_expires_at,
        status,
        created_at,
        updated_at
      )
      VALUES (
        ${userId},
        ${subjectName},
        ${JSON.stringify(pedagogyProfile)},
        ${JSON.stringify(units)},
        ${sourceFileName},
        ${sourceMimeType},
        ${sourceFileSizeBytes},
        NOW() + INTERVAL '24 hours',
        'active',
        NOW(),
        NOW()
      )
      RETURNING id, user_id, subject_name, pedagogy_profile, units, source_file_name, created_at
    `

    return NextResponse.json({ program: rows[0] })
  } catch (error) {
    return NextResponse.json(
      { error: 'No se pudo crear el programa', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
