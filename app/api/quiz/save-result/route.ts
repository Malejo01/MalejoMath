import { sql } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const {
      subject,
      mode,
      topics,
      totalQuestions,
      correctAnswers,
      score,
      answers
    } = body

    // 1. Verificar/crear usuario en nuestra DB
    const existingUser = await sql`
      SELECT id FROM users WHERE clerk_id = ${userId}
    `
    
    let dbUserId: string
    if (existingUser.length === 0) {
      const newUser = await sql`
        INSERT INTO users (clerk_id, email)
        VALUES (${userId}, ${''})
        RETURNING id
      `
      dbUserId = newUser[0].id
    } else {
      dbUserId = existingUser[0].id
    }

    // 2. Crear el quiz_attempt
    const quizAttempt = await sql`
      INSERT INTO quiz_attempts (user_id, subject, mode, topics, total_questions, correct_answers, score, completed_at)
      VALUES (${dbUserId}, ${subject}, ${mode}, ${topics}, ${totalQuestions}, ${correctAnswers}, ${score}, NOW())
      RETURNING id
    `
    const quizAttemptId = quizAttempt[0].id

    // 3. Guardar cada respuesta
    for (const answer of answers) {
      await sql`
        INSERT INTO quiz_answers (
          quiz_attempt_id,
          question_id,
          question_text,
          options,
          selected_answer,
          correct_answer,
          is_correct,
          explanation,
          topic_name
        ) VALUES (
          ${quizAttemptId},
          ${answer.questionId},
          ${answer.questionText},
          ${JSON.stringify(answer.options)},
          ${answer.selectedAnswer},
          ${answer.correctAnswer},
          ${answer.isCorrect},
          ${answer.explanation || ''},
          ${answer.topicName || ''}
        )
      `
    }

    // 4. Actualizar topic_mastery si la nota es >= 6
    if (score >= 6) {
      const topicsArray = Array.isArray(topics) ? topics : [topics]
      
      for (const topic of topicsArray) {
        const topicId = topic.id || topic
        const topicName = topic.name || topic
        
        // Verificar si ya existe un registro para este tema
        const existing = await sql`
          SELECT id, max_score, attempts_count FROM topic_mastery
          WHERE user_id = ${dbUserId} AND subject = ${subject} AND topic_id = ${topicId}
        `
        
        if (existing.length > 0) {
          // Actualizar si el nuevo score es mayor
          if (score > existing[0].max_score) {
            await sql`
              UPDATE topic_mastery
              SET max_score = ${score}, attempts_count = attempts_count + 1, last_attempt_at = NOW()
              WHERE id = ${existing[0].id}
            `
          } else {
            await sql`
              UPDATE topic_mastery
              SET attempts_count = attempts_count + 1, last_attempt_at = NOW()
              WHERE id = ${existing[0].id}
            `
          }
        } else {
          // Crear nuevo registro
          await sql`
            INSERT INTO topic_mastery (user_id, subject, topic_id, topic_name, max_score, attempts_count, last_attempt_at)
            VALUES (${dbUserId}, ${subject}, ${topicId}, ${topicName}, ${score}, 1, NOW())
          `
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      quizAttemptId,
      message: 'Resultado guardado exitosamente'
    })

  } catch (error) {
    console.error('[v0] Error saving quiz result:', error)
    return NextResponse.json(
      { error: 'Error al guardar el resultado' },
      { status: 500 }
    )
  }
}
