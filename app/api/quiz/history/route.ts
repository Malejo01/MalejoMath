import { sql } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener el user_id de nuestra DB
    const user = await sql`
      SELECT id FROM users WHERE clerk_id = ${userId}
    `
    
    if (user.length === 0) {
      return NextResponse.json({ attempts: [], mastery: [] })
    }

    const dbUserId = user[0].id

    // Obtener intentos de quiz (ultimos 20)
    const attempts = await sql`
      SELECT 
        id,
        subject,
        mode,
        topics,
        total_questions,
        correct_answers,
        score,
        completed_at
      FROM quiz_attempts
      WHERE user_id = ${dbUserId}
      ORDER BY completed_at DESC
      LIMIT 20
    `

    // Obtener dominio de temas
    const mastery = await sql`
      SELECT 
        subject,
        topic_id,
        topic_name,
        max_score,
        attempts_count,
        last_attempt_at
      FROM topic_mastery
      WHERE user_id = ${dbUserId}
      ORDER BY subject, topic_name
    `

    return NextResponse.json({ 
      attempts,
      mastery
    })

  } catch (error) {
    console.error('[v0] Error fetching history:', error)
    return NextResponse.json(
      { error: 'Error al obtener el historial' },
      { status: 500 }
    )
  }
}
