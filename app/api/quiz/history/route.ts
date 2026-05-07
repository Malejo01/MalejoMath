import { sql } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    console.log('[v0] History API called')
    
    const { userId } = await auth()
    console.log('[v0] Clerk userId:', userId)
    
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar si el usuario existe (user.id = clerk_id)
    console.log('[v0] Checking if user exists...')
    const user = await sql`
      SELECT id FROM users WHERE id = ${userId}
    `
    console.log('[v0] User exists:', user.length > 0)
    
    if (user.length === 0) {
      // Usuario no ha completado ningun quiz aun
      return NextResponse.json({ attempts: [], mastery: [] })
    }

    const { searchParams } = new URL(req.url)
    const subjectFilter = searchParams.get('subject')?.trim() || ''
    const modeFilter = searchParams.get('mode')?.trim() || ''
    const createdAfterFilter = searchParams.get('createdAfter')?.trim() || ''

    // Obtener intentos de quiz (ultimos 20)
    console.log('[v0] Fetching quiz attempts...')
    const rawAttempts = await sql`
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
      WHERE user_id = ${userId}
      ORDER BY completed_at DESC
      LIMIT 20
    `
    const attempts = rawAttempts.filter((attempt) => {
      const matchesSubject = subjectFilter.length === 0 || String(attempt.subject).toLowerCase().includes(subjectFilter.toLowerCase())
      const matchesMode = modeFilter.length === 0 || String(attempt.mode) === modeFilter
      const createdAfterTime = createdAfterFilter.length > 0 ? new Date(createdAfterFilter).getTime() : Number.NaN
      const completedTime = new Date(attempt.completed_at).getTime()
      const matchesDate = Number.isNaN(createdAfterTime) || completedTime >= createdAfterTime

      return matchesSubject && matchesMode && matchesDate
    })
    console.log('[v0] Found', attempts.length, 'attempts')

    // Obtener dominio de temas
    console.log('[v0] Fetching topic mastery...')
    const mastery = await sql`
      SELECT 
        subject,
        topic_id,
        topic_name,
        highest_score AS max_score,
        attempts_count,
        last_attempt_at
      FROM topic_mastery
      WHERE user_id = ${userId}
      ORDER BY subject, topic_name
    `
    console.log('[v0] Found', mastery.length, 'mastery records')

    return NextResponse.json({ 
      attempts,
      mastery
    })

  } catch (error) {
    console.error('[v0] Error fetching history:', error)
    console.error('[v0] Error details:', error instanceof Error ? error.message : String(error))
    console.error('[v0] Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { error: 'Error al obtener el historial', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
