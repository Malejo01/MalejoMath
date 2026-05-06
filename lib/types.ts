// Types for Malejo Math Application

export interface Subject {
  id: string
  name: string
  icon: string
  color: string
  units: Unit[]
  progress: number
  source?: 'core' | 'teacher'
  programId?: number
  pedagogyProfile?: PedagogyProfile
}

export interface Unit {
  id: string
  name: string
  topics: Topic[]
}

export interface Topic {
  id: string
  name: string
  group?: string
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
  pedagogyContext?: string
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
  subjectAverages: Record<string, number>
  subjectAttemptCounts: Record<string, number>
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

export type UserRole = 'student' | 'teacher'

export interface PedagogyProfile {
  level: string
  degree: string
  academicYear: string
  complexity: string
  assessmentStyle: 'teorico' | 'practico' | 'mixto'
  methodology: string
}

export interface ProgramSubtopic {
  id: string
  name: string
}

export interface ProgramTopic {
  id: string
  name: string
  subtopics: ProgramSubtopic[]
}

export interface ProgramUnit {
  id: string
  name: string
  topics: ProgramTopic[]
}

export interface TeacherProgram {
  id: number
  userId: string
  subjectName: string
  pedagogyProfile: PedagogyProfile
  units: ProgramUnit[]
  sourceFileName: string | null
  createdAt: string
}

export interface UserProfile {
  id: string
  email: string
  displayName: string
  role: UserRole
}
