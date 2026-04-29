import { sql } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id: attemptId } = await params

    // Verificar que el intento pertenece al usuario
    const attempt = await sql`
      SELECT 
        qa.id,
        qa.subject,
        qa.mode,
        qa.topics,
        qa.total_questions,
        qa.correct_answers,
        qa.score,
        qa.completed_at
      FROM quiz_attempts qa
      JOIN users u ON qa.user_id = u.id
      WHERE qa.id = ${attemptId} AND u.clerk_id = ${userId}
    `

    if (attempt.length === 0) {
      return NextResponse.json({ error: 'Intento no encontrado' }, { status: 404 })
    }

    // Obtener las respuestas del intento
    const answers = await sql`
      SELECT 
        id,
        question_id,
        question_text,
        options,
        selected_answer,
        correct_answer,
        is_correct,
        explanation,
        topic_name
      FROM quiz_answers
      WHERE quiz_attempt_id = ${attemptId}
      ORDER BY id
    `

    return NextResponse.json({
      attempt: attempt[0],
      answers
    })

  } catch (error) {
    console.error('[v0] Error fetching attempt details:', error)
    return NextResponse.json(
      { error: 'Error al obtener los detalles del intento' },
      { status: 500 }
    )
  }
}
