// Types for Malejo Math Application

export interface Subject {
  id: string
  name: string
  icon: string
  color: string
  units: Unit[]
  progress: number
}

export interface Unit {
  id: string
  name: string
  topics: Topic[]
}

export interface Topic {
  id: string
  name: string
  completed: boolean
}

export interface Question {
  id: string
  topic: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

export interface QuizConfig {
  subject: string
  topics: string[]
  mode: 'teorico' | 'practico'
  questionCount: number
}

export interface QuizResult {
  score: number
  total: number
  percentage: number
  incorrectTopics: string[]
  answers: {
    questionId: string
    selectedAnswer: number
    isCorrect: boolean
    topic: string
  }[]
}

export interface UserProgress {
  streak: number
  lastAttemptDate: string | null
  weakPoints: WeakPoint[]
  subjectProgress: Record<string, number>
}

export interface WeakPoint {
  topic: string
  subject: string
  count: number
}

export interface Attempt {
  id: string
  subject: string
  score: number
  type: 'teorico' | 'practico'
  topics: string[]
  createdAt: string
}
