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
  nivel?: string
  grado?: string
  difficulty?: 'basico' | 'intermedio' | 'avanzado'
  topics: { id: string; name: string }[]
  mode: 'teorico' | 'practico' | 'mixto'
  questionCount: number
  pedagogyContext?: string
  previewOnly?: boolean
  misconceptionContext?: string
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

export interface StudentTip {
  id?: number
  userId?: string
  subject: string
  topicId: string
  topicName: string
  misconceptionType: string
  tip: string
  resolved?: boolean
  createdAt?: string
}

export interface UserProgress {
  streak: number
  lastAttemptDate: string | null
  weakPoints: WeakPoint[]
  subjectProgress: Record<string, number>
  subjectAverages: Record<string, number>
  subjectAttemptCounts: Record<string, number>
  usedQuestionIds: string[]
  tips?: StudentTip[]
}

export interface WeakPoint {
  topic: string
  topicName: string
  subject: string
  count: number
  misconceptionType?: string
  lastTip?: string
  nivel?: string
  grado?: string
}

export interface QuizAttempt {
  id: string
  subject: string
  mode: string
  topics: string[]
  total_questions: number
  correct_answers: number
  score: number
  completed_at: string
}

export interface TopicMastery {
  subject: string
  topic_id: string
  topic_name: string
  max_score: number
  attempts_count: number
  last_attempt_at: string
}

export interface AttemptAnswer {
  id: string
  question_id: string
  question_text: string
  options: string[]
  selected_answer: number
  correct_answer: number
  is_correct: boolean
  explanation: string
  topic_name: string
}

export type UserRole = 'ALUMNO' | 'DOCENTE'

export interface PedagogyProfile {
  level: string
  degree: string
  academicYear: string
  complexity: string
  assessmentStyle: 'teorico' | 'practico' | 'mixto'
  methodology: string
}

export interface ProgramTopic {
  id: string
  name: string
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
  iconName: SubjectIconName
  colorName: SubjectColorName
  pedagogyProfile: PedagogyProfile
  units: ProgramUnit[]
  sourceFileName: string | null
  createdAt: string
}

export type SubjectIconName =
  | 'book-open'
  | 'calculator'
  | 'sigma'
  | 'chart-line'
  | 'flask-conical'
  | 'atom'
  | 'ruler'
  | 'landmark'
  | 'pie-chart'
  | 'target'

export type SubjectColorName =
  | 'teal'
  | 'blue'
  | 'orange'
  | 'green'
  | 'red'
  | 'indigo'
  | 'amber'
  | 'cyan'
  | 'emerald'
  | 'pink'

export type TeacherQuizStatus = 'saved' | 'pending_share'

export type QuizActionMode = 'realizar' | 'guardar' | 'compartir'

export interface TeacherQuiz {
  id: number
  userId: string
  teacherProgramId: number
  title: string
  subjectName: string
  mode: 'teorico' | 'practico' | 'mixto'
  status: TeacherQuizStatus
  selectedTopics: { id: string; name: string }[]
  questionCount: number
  questions: Question[]
  pedagogyContext?: string
  createdAt: string
  updatedAt: string
}

export interface TeacherProgramFilters {
  name: string
  level: string
  degree: string
  mode: '' | 'teorico' | 'practico' | 'mixto'
  createdAfter: string
}

export interface UserProfile {
  id: string
  email: string
  displayName: string
  role: UserRole
  nivel?: string
  grado?: string
}
