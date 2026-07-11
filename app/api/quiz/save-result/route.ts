import { sql } from '@/lib/db'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { debugLog } from '@/lib/utils'

export async function POST(req: Request) {
  try {
    debugLog('[v0] Save-result API called')
    
    const session = await auth()
    const userId = session?.user?.id ?? null
    
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    debugLog('[v0] Request body received, subject:', body.subject)
    const {
      subject,
      mode,
      topics,
      totalQuestions,
      correctAnswers,
      score,
      answers
    } = body

    const cleanSubject = subject || 'Matemática'

    // 1. Verificar/crear usuario en nuestra DB
    // The user is upserted at sign-in time in auth.ts, so this is a safety net.
    const existingUser = await sql`
      SELECT id FROM users WHERE id = ${userId}
    `

    if (existingUser.length === 0) {
      // Fallback: create minimal user row if somehow missing
      await sql`
        INSERT INTO users (id, email, created_at, updated_at)
        VALUES (${userId}, '', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `
    }

    // 2. Calcular incorrect_answers y passed
    const incorrectAnswers = totalQuestions - correctAnswers
    const passed = score >= 6

    // Map topics to a clean array of strings (names) for the quiz_attempts table
    const topicsStrings: string[] = Array.isArray(topics)
      ? topics.map((t) => (typeof t === 'string' ? t : String(t?.name || t?.id || '')))
      : [typeof topics === 'string' ? topics : String(topics?.name || topics?.id || '')]

    // 3. Crear el quiz_attempt
    debugLog('[v0] Creating quiz attempt...')
    const quizAttempt = await sql`
      INSERT INTO quiz_attempts (
        user_id, subject, mode, topics, total_questions, 
        correct_answers, incorrect_answers, score, passed, 
        started_at, completed_at
      )
      VALUES (
        ${userId}, ${cleanSubject}, ${mode}, ${topicsStrings}, ${totalQuestions}, 
        ${correctAnswers}, ${incorrectAnswers}, ${score}, ${passed},
        NOW(), NOW()
      )
      RETURNING id
    `
    const quizAttemptId = quizAttempt[0].id
    debugLog('[v0] Quiz attempt created with ID:', quizAttemptId)

    // 4. Guardar cada respuesta
    debugLog('[v0] Saving', answers.length, 'answers...')
    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i]
      await sql`
        INSERT INTO quiz_answers (
          quiz_attempt_id,
          question_index,
          question_id,
          question_text,
          options,
          selected_answer,
          correct_answer,
          is_correct,
          explanation,
          topic_name,
          created_at
        ) VALUES (
          ${quizAttemptId},
          ${i},
          ${answer.questionId || `q-${i}`},
          ${answer.questionText},
          ${JSON.stringify(answer.options)},
          ${answer.selectedAnswer},
          ${answer.correctAnswer},
          ${answer.isCorrect},
          ${answer.explanation || ''},
          ${answer.topicName || ''},
          NOW()
        )
      `
    }
    debugLog('[v0] All answers saved')

    // 5. Actualizar topic_mastery si la nota es >= 6
    if (score >= 6) {
      const topicsArray = Array.isArray(topics) ? topics : [topics]
      
      for (const topic of topicsArray) {
        const topicId = typeof topic === 'string' ? topic : (topic.id || topic)
        const topicName = typeof topic === 'string' ? topic : (topic.name || topic)
        
        // Verificar si ya existe un registro para este tema
        const existing = await sql`
          SELECT id, highest_score, attempts_count FROM topic_mastery
          WHERE user_id = ${userId} AND subject = ${cleanSubject} AND topic_id = ${topicId}
        `
        
        if (existing.length > 0) {
          // Actualizar si el nuevo score es mayor
          const currentHighest = existing[0].highest_score || 0
          if (score > currentHighest) {
            await sql`
              UPDATE topic_mastery
              SET highest_score = ${score}, attempts_count = attempts_count + 1, 
                  last_attempt_at = NOW(), updated_at = NOW()
              WHERE id = ${existing[0].id}
            `
          } else {
            await sql`
              UPDATE topic_mastery
              SET attempts_count = attempts_count + 1, last_attempt_at = NOW(), updated_at = NOW()
              WHERE id = ${existing[0].id}
            `
          }
        } else {
          // Crear nuevo registro
          await sql`
            INSERT INTO topic_mastery (
              user_id, subject, topic_id, topic_name, highest_score, 
              attempts_count, last_attempt_at, created_at, updated_at
            )
            VALUES (
              ${userId}, ${cleanSubject}, ${topicId}, ${topicName}, ${score}, 
              1, NOW(), NOW(), NOW()
            )
          `
        }
      }
    }

    debugLog('[v0] Save completed successfully')
    return NextResponse.json({ 
      success: true, 
      quizAttemptId,
      message: 'Resultado guardado exitosamente'
    })

  } catch (error) {
    console.error('[v0] Error saving quiz result:', error)
    console.error('[v0] Error details:', error instanceof Error ? error.message : String(error))
    console.error('[v0] Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { error: 'Error al guardar el resultado', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
