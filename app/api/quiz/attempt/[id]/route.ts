import { sql } from '@/lib/db'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const userId = session?.user?.id ?? null
    
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id: attemptId } = await params

    // Verificar que el intento pertenece al usuario (user_id = clerk_id directamente)
    const attempt = await sql`
      SELECT 
        id,
        subject,
        mode,
        topics,
        total_questions,
        correct_answers,
        incorrect_answers,
        score,
        passed,
        completed_at
      FROM quiz_attempts
      WHERE id = ${attemptId} AND user_id = ${userId}
    `

    if (attempt.length === 0) {
      return NextResponse.json({ error: 'Intento no encontrado' }, { status: 404 })
    }

    // Obtener las respuestas del intento
    const answers = await sql`
      SELECT 
        id,
        question_index,
        question_id,
        question_text,
        options,
        selected_answer,
        correct_answer,
        is_correct,
        explanation,
        error_explanation,
        topic_name
      FROM quiz_answers
      WHERE quiz_attempt_id = ${attemptId}
      ORDER BY question_index
    `

    return NextResponse.json({
      attempt: attempt[0],
      answers
    })

  } catch (error) {
    console.error('[v0] Error fetching attempt details:', error)
    console.error('[v0] Error details:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: 'Error al obtener los detalles del intento', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
