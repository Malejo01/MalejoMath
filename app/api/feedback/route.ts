import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getViewer } from '@/lib/auth-session'
import type { QuestionType } from '@/lib/types'

export const dynamic = 'force-dynamic'

/** Igual que el CHECK de scripts/019-feedback-reports.sql. */
const MAX_DESCRIPTION = 4000
const MAX_PATHNAME = 512
const MAX_USER_AGENT = 512
const MAX_QUESTION_ID = 128

/**
 * Techo por usuario y por hora. No es defensa contra un atacante — quien tenga
 * una cookie de invitado puede pedir otra — sino contra el caso real: alguien
 * frustrado apretando "enviar" quince veces, o un bug del cliente reenviando en
 * loop. Diez reportes en una hora ya es más de lo que cualquiera escribe a mano.
 */
const MAX_REPORTS_PER_HOUR = 10

const QUESTION_TYPES: QuestionType[] = ['multiple_choice', 'short_answer', 'true_false', 'numeric']

function trimTo(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : null
}

/**
 * POST /api/feedback — { description, pathname?, questionId?, questionType? }
 *
 * El cuerpo trae SÓLO lo que el servidor no puede saber: qué escribió la
 * persona y qué estaba mirando. La identidad (user_id / guest_id y rol) sale de
 * `getViewer()`, nunca del cliente: si viniera en el body, cualquiera podría
 * firmar un reporte con el id de otro, y el buzón dejaría de servir justamente
 * para lo que existe, que es saber a quién volver a preguntarle.
 *
 * Exige identidad — cuenta de Google o cookie de invitado. El botón sólo se
 * monta dentro de AppGuards, donde siempre hay una de las dos, así que un 401
 * acá significa que la sesión venció mientras el formulario estaba abierto.
 */
export async function POST(req: Request) {
  try {
    const viewer = await getViewer()
    if (!viewer) {
      return NextResponse.json(
        { error: 'Necesitás una sesión activa para enviar un reporte.' },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => null)
    const description = trimTo(body?.description, MAX_DESCRIPTION)

    if (!description) {
      return NextResponse.json({ error: 'Contanos qué pasó antes de enviar.' }, { status: 400 })
    }

    const recent = (await sql`
      SELECT COUNT(*)::int AS count
      FROM feedback_reports
      WHERE user_id = ${viewer.id} AND created_at > NOW() - INTERVAL '1 hour'
    `) as { count: number }[]

    if ((recent[0]?.count ?? 0) >= MAX_REPORTS_PER_HOUR) {
      return NextResponse.json(
        { error: 'Ya enviaste varios reportes en la última hora. Probá de nuevo más tarde.' },
        { status: 429 }
      )
    }

    // El tipo de pregunta se valida contra la unión en vez de guardarse crudo:
    // una columna de contexto con valores inventados es peor que una vacía,
    // porque se filtra por ella creyendo que dice algo.
    const rawType = trimTo(body?.questionType, 32)
    const questionType = QUESTION_TYPES.includes(rawType as QuestionType) ? rawType : null

    const rows = (await sql`
      INSERT INTO feedback_reports (
        user_id, is_guest, role, description, pathname, question_id, question_type, user_agent
      ) VALUES (
        ${viewer.id},
        ${viewer.isGuest},
        ${viewer.role},
        ${description},
        ${trimTo(body?.pathname, MAX_PATHNAME)},
        ${trimTo(body?.questionId, MAX_QUESTION_ID)},
        ${questionType},
        ${trimTo(req.headers.get('user-agent'), MAX_USER_AGENT)}
      )
      RETURNING id
    `) as { id: number }[]

    return NextResponse.json({ id: rows[0]?.id })
  } catch (error) {
    console.error('[POST /api/feedback] Error:', error)
    return NextResponse.json(
      { error: 'No pudimos guardar tu reporte. Intentá de nuevo en un momento.' },
      { status: 500 }
    )
  }
}
