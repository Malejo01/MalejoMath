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
  topicName: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export interface QuizConfig {
  subject: string
  subjectName: string
  topics: { id: string; name: string }[]
  mode: 'teorico' | 'practico'
  questionCount: number
}

export interface Answer {
  questionId: string
  questionText: string
  options: string[]
  selectedAnswer: number
  correctAnswer: number
  isCorrect: boolean
  topic: string
  topicName: string
  explanation: string
}

export interface QuizResult {
  score: number
  total: number
  percentage: number
  incorrectTopics: string[]
  answers: Answer[]
  correctAnswers: Answer[]
  incorrectAnswers: Answer[]
}

export interface UserProgress {
  streak: number
  lastAttemptDate: string | null
  weakPoints: WeakPoint[]
  subjectProgress: Record<string, number>
  usedQuestionIds: string[]
}

export interface WeakPoint {
  topic: string
  topicName: string
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
