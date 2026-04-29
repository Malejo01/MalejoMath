import { neon } from '@neondatabase/serverless'

export const sql = neon(process.env.DATABASE_URL!)

// Types for database operations
export interface DbUser {
  id: string
  clerk_id: string
  email: string
  created_at: Date
}

export interface DbTopicMastery {
  id: string
  user_id: string
  subject: string
  topic_id: string
  topic_name: string
  max_score: number
  attempts_count: number
  last_attempt_at: Date
}

export interface DbQuizAttempt {
  id: string
  user_id: string
  subject: string
  mode: 'teorico' | 'practico'
  topics: string[]
  total_questions: number
  correct_answers: number
  score: number
  started_at: Date
  completed_at: Date
}

export interface DbQuizAnswer {
  id: string
  quiz_attempt_id: string
  question_id: string
  question_text: string
  options: string[]
  selected_answer: number
  correct_answer: number
  is_correct: boolean
  explanation: string
  topic_name: string
}
