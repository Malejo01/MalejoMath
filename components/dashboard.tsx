'use client'

import { useRouter } from 'next/navigation'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { subjects } from '@/lib/data'
import { teacherProgramToSubject } from '@/lib/teacher-programs'
import { SUBJECT_COLOR_CLASS } from '@/lib/subject-appearance'
import { SubjectTabs } from './subject-tabs'
import { SubjectContent } from './subject-content'
import { WeakPointsSection } from './weak-points-section'
import { TipsChest } from './tips-chest'
import { MathBackground } from './math-background'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navbar } from './navbar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Target,
  TrendingUp,
  Sigma,
  Calculator,
  ChartLine,
  History,
  FlaskConical,
  Atom,
  Ruler,
  Landmark,
  PieChart,
  LineChart,
  BarChart3,
  BookOpen,
  Upload,
  Filter,
  Pencil,
  Trash2,
  PlayCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Download,
  Sparkles,
  CheckCircle,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { TeacherProgramUploadModal } from './teacher-program-upload-modal'
import { useToast } from '@/hooks/use-toast'
import { exportQuizToMoodleGift } from '@/lib/moodle-export'
import type { TeacherProgram, TeacherQuiz, StudentTip } from '@/lib/types'

type TeacherProgramApiShape = TeacherProgram & {
  user_id?: string
  subject_name?: string
  icon_name?: TeacherProgram['iconName']
  color_name?: TeacherProgram['colorName']
  pedagogy_profile?: TeacherProgram['pedagogyProfile']
  source_file_name?: string | null
  created_at?: string
}

function normalizeTeacherProgram(program: TeacherProgramApiShape): TeacherProgram {
  return {
    id: Number(program.id),
    userId: program.userId ?? program.user_id ?? '',
    subjectName: program.subjectName ?? program.subject_name ?? 'Materia docente',
    iconName: program.iconName ?? program.icon_name ?? 'book-open',
    colorName: program.colorName ?? program.color_name ?? 'teal',
    pedagogyProfile: program.pedagogyProfile ?? program.pedagogy_profile ?? {
      level: 'No especificado',
      degree: 'No especificado',
      academicYear: 'No especificado',
      complexity: 'No especificado',
      assessmentStyle: 'mixto',
      methodology: 'No especificado',
    },
    units: Array.isArray(program.units) ? program.units : [],
    sourceFileName: program.sourceFileName ?? program.source_file_name ?? null,
    createdAt: program.createdAt ?? program.created_at ?? new Date().toISOString(),
  }
}

function normalizeTeacherQuiz(quiz: Record<string, unknown>): TeacherQuiz {
  const rawMode = quiz.mode
  const normalizedMode = rawMode === 'practico' ? 'practico' : rawMode === 'mixto' ? 'mixto' : 'teorico'

  return {
    id: Number(quiz.id),
    userId: String(quiz.user_id || ''),
    teacherProgramId: Number(quiz.teacher_program_id || 0),
    title: String(quiz.title || 'Cuestionario docente'),
    subjectName: String(quiz.subject_name || ''),
    mode: normalizedMode,
    status: quiz.status === 'pending_share' ? 'pending_share' : 'saved',
    selectedTopics: Array.isArray(quiz.selected_topics) ? (quiz.selected_topics as { id: string; name: string }[]) : [],
    questionCount: Number(quiz.question_count || 0),
    questions: Array.isArray(quiz.questions) ? (quiz.questions as TeacherQuiz['questions']) : [],
    pedagogyContext: quiz.pedagogy_context ? String(quiz.pedagogy_context) : undefined,
    createdAt: String(quiz.created_at || new Date().toISOString()),
    updatedAt: String(quiz.updated_at || new Date().toISOString()),
  }
}

const programIconMap = {
  'book-open': BookOpen,
  calculator: Calculator,
  sigma: Sigma,
  'chart-line': ChartLine,
  'flask-conical': FlaskConical,
  atom: Atom,
  ruler: Ruler,
  landmark: Landmark,
  'pie-chart': PieChart,
  target: Target,
}

export function Dashboard() {
  const {
    userProgress,
    userProfile,
    teacherPrograms,
    teacherQuizzes,
    teacherProgramFilters,
    teacherSection,
    clearSelectedTopics,
    setSelectedSubject,
    setActiveView,
    setTeacherPrograms,
    addTeacherProgram,
    updateTeacherProgram,
    removeTeacherProgram,
    setTeacherQuizzes,
    removeTeacherQuiz,
    setTeacherProgramFilters,
    setTeacherSection,
    startQuiz,
    startQuizPreview,
  } = useAppStore()
  const { data: session, status } = useSession()
  const isSignedIn = status === 'authenticated'
  const { toast } = useToast()
  const router = useRouter()

  const [activeSubject, setActiveSubject] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showOnlyMySubjects, setShowOnlyMySubjects] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showExamples, setShowExamples] = useState(false)
  const [showCreateExamples, setShowCreateExamples] = useState(false)
  const [showQuizExamples, setShowQuizExamples] = useState(false)
  const [quizSubjectFilter, setQuizSubjectFilter] = useState<string>('all')
  const [studentTips, setStudentTips] = useState<StudentTip[]>([])
  const [performedQuizzes, setPerformedQuizzes] = useState<Record<string, unknown>[]>([])
  const [expandedQuizId, setExpandedQuizId] = useState<number | null>(null)
  const [exportingQuizId, setExportingQuizId] = useState<number | null>(null)
  const mySubjectsScrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    fetch('/api/user/tips')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.tips)) setStudentTips(data.tips)
      })
      .catch((err) => console.warn('Could not fetch student tips:', err))
  }, [])
  const [canScrollMySubjectsLeft, setCanScrollMySubjectsLeft] = useState(false)
  const [canScrollMySubjectsRight, setCanScrollMySubjectsRight] = useState(false)

  const isTeacher = userProfile?.role === 'DOCENTE'
  const teacherSubjects = teacherPrograms.map((program) => teacherProgramToSubject(program))
  const studentSubjects = teacherSubjects
  const teacherAvailableSubjects = teacherSubjects

  useEffect(() => {
    clearSelectedTopics()
  }, [clearSelectedTopics])

  useEffect(() => {
    if (!isSignedIn || !isTeacher) {
      setTeacherPrograms([])
      return
    }

    let isMounted = true

    const loadPrograms = async () => {
      try {
        const query = new URLSearchParams()
        if (teacherProgramFilters.name) query.set('name', teacherProgramFilters.name)
        if (teacherProgramFilters.level) query.set('level', teacherProgramFilters.level)
        if (teacherProgramFilters.degree) query.set('degree', teacherProgramFilters.degree)
        if (teacherProgramFilters.createdAfter) query.set('createdAfter', teacherProgramFilters.createdAfter)

        const response = await fetch(`/api/teacher/programs?${query.toString()}`)
        const data = await response.json()

        if (!response.ok || !isMounted) {
          return
        }

        const normalizedPrograms = (Array.isArray(data.programs) ? data.programs : [])
          .map((program: any) => normalizeTeacherProgram(program as TeacherProgramApiShape))

        setTeacherPrograms(normalizedPrograms)
      } catch {
        if (isMounted) {
          setTeacherPrograms([])
        }
      }
    }

    loadPrograms()

    return () => {
      isMounted = false
    }
  }, [isSignedIn, isTeacher, teacherProgramFilters.name, teacherProgramFilters.level, teacherProgramFilters.degree, teacherProgramFilters.createdAfter, setTeacherPrograms])

  const selectedSubject = (isTeacher ? teacherAvailableSubjects : studentSubjects).find((subject) => subject.id === activeSubject)

  useEffect(() => {
    if (!isSignedIn) return

    let isMounted = true

    const loadData = async () => {
      try {
        if (isTeacher) {
          const quizzesQuery = new URLSearchParams()
          if (teacherProgramFilters.mode) quizzesQuery.set('mode', teacherProgramFilters.mode)
          if (teacherProgramFilters.createdAfter) quizzesQuery.set('createdAfter', teacherProgramFilters.createdAfter)

          if (teacherSection !== 'cuestionarios' && selectedSubject?.programId) {
            quizzesQuery.set('programId', String(selectedSubject.programId))
          } else if (teacherSection === 'cuestionarios' && quizSubjectFilter.startsWith('teacher-')) {
            quizzesQuery.set('programId', quizSubjectFilter.replace('teacher-', ''))
          }

          const historyQuery = new URLSearchParams()
          if (teacherProgramFilters.mode) historyQuery.set('mode', teacherProgramFilters.mode)
          if (teacherProgramFilters.createdAfter) historyQuery.set('createdAfter', teacherProgramFilters.createdAfter)

          if (teacherSection !== 'cuestionarios' && selectedSubject?.programId) {
            historyQuery.set('subject', selectedSubject.name)
          } else if (teacherSection === 'cuestionarios' && quizSubjectFilter !== 'all') {
            if (quizSubjectFilter.startsWith('teacher-')) {
              const teacherProgramId = Number(quizSubjectFilter.replace('teacher-', ''))
              const filteredProgram = teacherPrograms.find((program) => program.id === teacherProgramId)
              if (filteredProgram) {
                historyQuery.set('subject', filteredProgram.subjectName)
              }
            }
          }

          const [savedRes, historyRes] = await Promise.all([
            fetch(`/api/teacher/quizzes?${quizzesQuery.toString()}`),
            fetch(`/api/quiz/history?${historyQuery.toString()}`),
          ])

          const savedData = await savedRes.json()
          const historyData = await historyRes.json()

          if (!isMounted) return

          if (savedRes.ok) {
            const normalizedQuizzes = (Array.isArray(savedData.quizzes) ? savedData.quizzes : []).map((quiz: any) => normalizeTeacherQuiz(quiz as Record<string, unknown>))
            setTeacherQuizzes(normalizedQuizzes)
          } else {
            setTeacherQuizzes([])
          }

          if (historyRes.ok) {
            setPerformedQuizzes(Array.isArray(historyData.attempts) ? historyData.attempts : [])
          } else {
            setPerformedQuizzes([])
          }
        } else {
          // ALUMNO: load all history attempts for recent activity
          const historyRes = await fetch('/api/quiz/history')
          const historyData = await historyRes.json()

          if (!isMounted) return

          if (historyRes.ok) {
            setPerformedQuizzes(Array.isArray(historyData.attempts) ? historyData.attempts : [])
          } else {
            setPerformedQuizzes([])
          }
        }
      } catch {
        if (isMounted) {
          setTeacherQuizzes([])
          setPerformedQuizzes([])
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [isSignedIn, isTeacher, teacherSection, quizSubjectFilter, selectedSubject?.programId, selectedSubject?.name, teacherProgramFilters.mode, teacherProgramFilters.createdAfter, teacherPrograms, setTeacherQuizzes])

  useEffect(() => {
    if (quizSubjectFilter === 'all' || !quizSubjectFilter.startsWith('teacher-')) return
    const teacherProgramId = Number(quizSubjectFilter.replace('teacher-', ''))
    if (!teacherPrograms.some((program) => program.id === teacherProgramId)) {
      setQuizSubjectFilter('all')
    }
  }, [quizSubjectFilter, teacherPrograms])

  const handleSubjectChange = (subjectId: string | null) => {
    setActiveSubject(subjectId)
    setSelectedSubject(subjectId)
    setExpandedQuizId(null)
  }

  const handleTeacherSubjectPick = (subjectId: string) => {
    handleSubjectChange(subjectId)
  }

  const updateMySubjectsScrollState = useCallback(() => {
    const container = mySubjectsScrollRef.current
    if (!container) return

    const maxScrollLeft = container.scrollWidth - container.clientWidth
    setCanScrollMySubjectsLeft(container.scrollLeft > 4)
    setCanScrollMySubjectsRight(container.scrollLeft < maxScrollLeft - 4)
  }, [])

  const scrollMySubjects = useCallback((direction: 'left' | 'right') => {
    const container = mySubjectsScrollRef.current
    if (!container) return

    const delta = direction === 'left' ? -280 : 280
    container.scrollBy({ left: delta, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const container = mySubjectsScrollRef.current
    if (!container) return

    updateMySubjectsScrollState()
    container.addEventListener('scroll', updateMySubjectsScrollState)
    window.addEventListener('resize', updateMySubjectsScrollState)

    return () => {
      container.removeEventListener('scroll', updateMySubjectsScrollState)
      window.removeEventListener('resize', updateMySubjectsScrollState)
    }
  }, [teacherPrograms.length, updateMySubjectsScrollState])

  const renderTeacherProgramCard = (program: TeacherProgram, extraClassName?: string) => {
    const subjectId = `teacher-${program.id}`
    const isSelected = activeSubject === subjectId
    const Icon = programIconMap[program.iconName] ?? BookOpen
    const chipClass = SUBJECT_COLOR_CLASS[program.colorName]?.chip ?? 'bg-teal-500'

    return (
      <Card
        key={program.id}
        className={`relative w-full p-4 pt-6 min-h-[170px] border-2 cursor-pointer transition-all ${isSelected ? 'border-primary shadow-md bg-primary/5' : 'border-border hover:border-primary/40'} ${extraClassName ?? ''}`}
        onClick={() => handleTeacherSubjectPick(subjectId)}
      >
        <button
          type="button"
          className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center hover:bg-muted"
          onClick={(event) => {
            event.stopPropagation()
            handleSubjectChange(subjectId)
            setShowEditModal(true)
          }}
          aria-label="Editar materia"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          type="button"
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-600 text-white border-2 border-red-600 flex items-center justify-center hover:bg-red-700"
          onClick={(event) => {
            event.stopPropagation()
            handleSubjectChange(subjectId)
            setShowDeleteDialog(true)
          }}
          aria-label="Eliminar materia"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center gap-2 pt-1">
          <div className={`w-11 h-11 rounded-xl ${chipClass} text-white flex items-center justify-center shadow-sm`}>
            <Icon className="w-5 h-5" />
          </div>
          <p className="font-semibold leading-snug whitespace-normal break-words text-sm sm:text-[15px] w-full px-1">
            {program.subjectName}
          </p>
          <p className="text-xs text-muted-foreground">{program.units.length} unidades</p>
        </div>
      </Card>
    )
  }

  const selectedSubjectAverage = activeSubject
    ? (userProgress.subjectAverages?.[activeSubject] ?? 0)
    : 0

  const selectedSubjectAttempts = activeSubject
    ? (userProgress.subjectAttemptCounts?.[activeSubject] ?? 0)
    : 0

  const averageCardConfig = {
    algebra: {
      icon: Sigma,
      iconBg: 'bg-[var(--algebra-light)]',
      iconText: 'text-[var(--algebra)]',
      title: 'Tu promedio en Algebra',
    },
    analisis: {
      icon: LineChart,
      iconBg: 'bg-[var(--analysis-light)]',
      iconText: 'text-[var(--analysis)]',
      title: 'Tu promedio en Analisis',
    },
    probabilidad: {
      icon: BarChart3,
      iconBg: 'bg-[var(--probability-light)]',
      iconText: 'text-[var(--probability)]',
      title: 'Tu promedio en Probabilidad',
    },
    default: {
      icon: BookOpen,
      iconBg: 'bg-muted',
      iconText: 'text-muted-foreground',
      title: 'Selecciona una materia',
    }
  }

  const currentAverageCard = activeSubject
    ? averageCardConfig[activeSubject as keyof typeof averageCardConfig] ?? averageCardConfig.default
    : averageCardConfig.default

  const AverageIcon = currentAverageCard.icon

  const totalProgress = Math.round(
    Object.values(userProgress.subjectProgress).reduce((a, b) => a + b, 0) / 3
  )

  const activeTeacherProgram = useMemo(
    () => teacherPrograms.find((program) => `teacher-${program.id}` === selectedSubject?.id) ?? null,
    [teacherPrograms, selectedSubject?.id]
  )

  const handleDeleteActiveProgram = async () => {
    if (!activeTeacherProgram) return

    try {
      const response = await fetch(`/api/teacher/programs/${activeTeacherProgram.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        return
      }

      removeTeacherProgram(activeTeacherProgram.id)
      setShowDeleteDialog(false)
      setActiveSubject(null)
      setSelectedSubject(null)
    } catch {
      // noop
    }
  }

  const handleDeleteQuiz = async (quizId: number) => {
    try {
      const response = await fetch(`/api/teacher/quizzes/${quizId}`, { method: 'DELETE' })
      if (!response.ok) return
      removeTeacherQuiz(quizId)
    } catch {
      // noop
    }
  }

  const handleRunQuiz = (quiz: TeacherQuiz) => {
    startQuiz(
      {
        subject: `teacher-${quiz.teacherProgramId}`,
        subjectName: quiz.subjectName,
        topics: quiz.selectedTopics,
        mode: quiz.mode,
        questionCount: quiz.questionCount,
        pedagogyContext: quiz.pedagogyContext,
      },
      quiz.questions
    )
  }

  const handlePreviewQuiz = (quiz: TeacherQuiz) => {
    startQuizPreview(
      {
        subject: `teacher-${quiz.teacherProgramId}`,
        subjectName: quiz.subjectName,
        topics: quiz.selectedTopics,
        mode: quiz.mode,
        questionCount: quiz.questionCount,
        pedagogyContext: quiz.pedagogyContext,
      },
      quiz.questions
    )
  }

  const handleExportQuiz = (quiz: TeacherQuiz) => {
    try {
      setExportingQuizId(quiz.id)
      const fileName = exportQuizToMoodleGift(quiz)
      toast({ title: 'Exportacion lista', description: `Se descargo ${fileName}` })
    } catch (error) {
      toast({
        title: 'No se pudo exportar',
        description: error instanceof Error ? error.message : 'Error desconocido al exportar a Moodle.',
      })
    } finally {
      setExportingQuizId(null)
    }
  }

  return (
    <div className="min-h-screen relative">
      <MathBackground />

      <Navbar />

      {/* Welcome header */}
      <div className="px-4 pt-6 pb-2 text-left">
        <h1 className="text-2xl font-black text-foreground">
          {session?.user?.name ? `¡Hola, ${session.user.name.split(' ')[0]}! 👋` : '¡Bienvenido/a! 👋'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isTeacher
            ? 'Gestioná tus materias, programas y cuestionarios educativos.'
            : 'Practicá matemática con Inteligencia Artificial basada en tu plan de estudios.'}
        </p>
      </div>

      {/* Call to Action Card */}
      <div className="px-4 py-2">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary via-indigo-600 to-violet-700 text-white shadow-xl relative overflow-hidden">
          {/* Subtle math-themed geometric decorations */}
          <div className="absolute right-[-10px] bottom-[-20px] opacity-10 text-9xl font-bold select-none pointer-events-none">
            f(x)
          </div>
          <div className="absolute right-[40px] top-[-10px] opacity-10 text-6xl font-bold select-none pointer-events-none">
            ∑
          </div>

          <div className="relative z-10 max-w-[85%] space-y-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Evaluaciones Inteligentes
              </span>
              <h2 className="text-xl font-black leading-tight">
                {isTeacher ? 'Generar Cuestionario' : 'Comenzar a practicar'}
              </h2>
              <p className="text-xs text-white/80 mt-1.5 leading-relaxed">
                {isTeacher
                  ? 'Diseñá cuestionarios a medida basados en la Currícula Oficial de Salta o subiendo tu propio programa.'
                  : 'Creá un cuestionario personalizado seleccionando tu grado, materia y temas específicos.'}
              </p>
            </div>

            <Button
              onClick={() => setActiveView('selector')}
              className="bg-white hover:bg-white/90 text-indigo-700 hover:text-indigo-800 font-bold px-5 py-2.5 rounded-xl shadow-md transition-all duration-200 active:scale-95 flex items-center gap-2 text-sm"
            >
              {isTeacher ? 'Generar Cuestionario' : 'Comenzar ahora'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <main className="px-4 py-5 pb-8 space-y-5">
        {!isTeacher && (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              {/* Streak Card */}
              <Card className="p-3 border-2 border-border bg-card/80 backdrop-blur-sm flex flex-col items-center text-center">
                <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center mb-1.5">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                </div>
                <div className="text-xl font-black text-foreground">{userProgress.streak}</div>
                <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Racha días</div>
              </Card>

              {/* Completed Quizzes Card */}
              <Card className="p-3 border-2 border-border bg-card/80 backdrop-blur-sm flex flex-col items-center text-center">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center mb-1.5">
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-xl font-black text-foreground">{performedQuizzes.length}</div>
                <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Realizados</div>
              </Card>

              {/* Weak Points Card */}
              <Card className="p-3 border-2 border-border bg-card/80 backdrop-blur-sm flex flex-col items-center text-center">
                <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center mb-1.5">
                  <Target className="w-5 h-5 text-rose-500" />
                </div>
                <div className="text-xl font-black text-foreground">{userProgress.weakPoints.length}</div>
                <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">A Reforzar</div>
              </Card>
            </div>

            {/* Weak Points Section */}
            {userProgress.weakPoints.length > 0 && (
              <WeakPointsSection weakPoints={userProgress.weakPoints} />
            )}

            {/* Cofre de Tips / Mis Apuntes Section */}
            <TipsChest tips={studentTips} />

            {/* Recent Activity Button */}
            {performedQuizzes.length > 0 && (
              <section className="mt-6">
                <Card
                  onClick={() => router.push('/history')}
                  className="p-4 border-2 border-border/80 bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer rounded-2xl flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
                      <History className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                        Historial de Evaluaciones y Actividad Reciente
                      </h4>
                      <p className="text-xs text-muted-foreground font-medium">
                        Tienes {performedQuizzes.length} evaluación{performedQuizzes.length > 1 ? 'es' : ''} realizada{performedQuizzes.length > 1 ? 's' : ''} en tu historial
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-xs font-bold text-primary gap-1 group-hover:translate-x-0.5 transition-transform shrink-0"
                  >
                    <span>Ver Historial</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Card>
              </section>
            )}
          </>
        )}

        {isTeacher && (
          <div className="space-y-4">
            <Card className="p-3 rounded-2xl border border-border/60 bg-card/75 backdrop-blur-md shadow-[0_6px_30px_rgba(23,23,23,0.06)]">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-3">Panel Docente</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  className={`min-w-0 h-11 px-2 sm:px-3 rounded-xl justify-center sm:justify-start shadow-sm ${teacherSection === 'materias' ? 'bg-[var(--algebra-light)] text-[var(--algebra)] border-[var(--algebra)]/40 hover:bg-[var(--algebra-light)]' : 'bg-white/70 border-border/70 hover:bg-[var(--algebra-light)]/70 hover:text-[var(--algebra)]'}`}
                  variant="outline"
                  onClick={() => setTeacherSection('materias')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  <span className="text-[11px] sm:text-xs md:text-sm leading-tight text-center sm:text-left whitespace-normal">Mis materias</span>
                </Button>
                <Button
                  className={`min-w-0 h-11 px-2 sm:px-3 rounded-xl justify-center sm:justify-start shadow-sm ${teacherSection === 'crear' ? 'bg-[var(--analysis-light)] text-[var(--analysis)] border-[var(--analysis)]/40 hover:bg-[var(--analysis-light)]' : 'bg-white/70 border-border/70 hover:bg-[var(--analysis-light)]/70 hover:text-[var(--analysis)]'}`}
                  variant="outline"
                  onClick={() => setTeacherSection('crear')}
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  <span className="text-[11px] sm:text-xs md:text-sm leading-tight text-center sm:text-left whitespace-normal">Crear cuestionario</span>
                </Button>
                <Button
                  className={`min-w-0 h-11 px-2 sm:px-3 rounded-xl justify-center sm:justify-start shadow-sm ${teacherSection === 'cuestionarios' ? 'bg-[var(--probability-light)] text-[var(--probability)] border-[var(--probability)]/40 hover:bg-[var(--probability-light)]' : 'bg-white/70 border-border/70 hover:bg-[var(--probability-light)]/70 hover:text-[var(--probability)]'}`}
                  variant="outline"
                  onClick={() => setTeacherSection('cuestionarios')}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  <span className="text-[11px] sm:text-xs md:text-sm leading-tight text-center sm:text-left whitespace-normal">Mis cuestionarios</span>
                </Button>
              </div>
            </Card>

            <div className="space-y-4">
              {teacherSection === 'materias' && (
                <Card className="p-4 rounded-2xl border border-border/60 bg-card/75 backdrop-blur-md shadow-[0_6px_30px_rgba(23,23,23,0.06)] space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={() => setShowUploadModal(true)} className="rounded-xl font-bold">
                      <Upload className="w-4 h-4 mr-2" />
                      Subir Programa
                    </Button>
                    <Button
                      variant={showFilters ? 'default' : 'outline'}
                      onClick={() => setShowFilters((prev) => !prev)}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filtros
                    </Button>
                  </div>

                  {showFilters && (
                    <div className="space-y-3">
                      <Button
                        variant={showOnlyMySubjects ? 'default' : 'outline'}
                        onClick={() => setShowOnlyMySubjects((prev) => !prev)}
                      >
                        Mostrar solo mis materias
                      </Button>
                      <div className="grid sm:grid-cols-2 gap-2">
                        <input
                          className="border rounded-md px-3 py-2 bg-background text-sm"
                          placeholder="Filtrar por nombre"
                          value={teacherProgramFilters.name}
                          onChange={(event) => setTeacherProgramFilters({ name: event.target.value })}
                        />
                        <input
                          className="border rounded-md px-3 py-2 bg-background text-sm"
                          placeholder="Filtrar por nivel"
                          value={teacherProgramFilters.level}
                          onChange={(event) => setTeacherProgramFilters({ level: event.target.value })}
                        />
                        <input
                          className="border rounded-md px-3 py-2 bg-background text-sm"
                          placeholder="Filtrar por carrera"
                          value={teacherProgramFilters.degree}
                          onChange={(event) => setTeacherProgramFilters({ degree: event.target.value })}
                        />
                        <select
                          className="border rounded-md px-3 py-2 bg-background text-sm"
                          value={teacherProgramFilters.mode}
                          onChange={(event) => setTeacherProgramFilters({ mode: event.target.value as '' | 'teorico' | 'practico' | 'mixto' })}
                        >
                          <option value="">Modo (todos)</option>
                          <option value="teorico">Teorico</option>
                          <option value="practico">Practico</option>
                          <option value="mixto">Mixto</option>
                        </select>
                        <input
                          className="border rounded-md px-3 py-2 bg-background text-sm sm:col-span-2"
                          type="date"
                          value={teacherProgramFilters.createdAfter}
                          onChange={(event) => setTeacherProgramFilters({ createdAfter: event.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Mis materias</h2>
                    {teacherPrograms.length === 0 && (
                      <p className="text-sm text-muted-foreground">Todavia no cargaste materias propias.</p>
                    )}
                    {teacherPrograms.length <= 3 ? (
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {teacherPrograms.map((program) => renderTeacherProgramCard(program))}
                      </div>
                    ) : (
                      <div className="relative">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/90 backdrop-blur disabled:opacity-30"
                          onClick={() => scrollMySubjects('left')}
                          disabled={!canScrollMySubjectsLeft}
                          aria-label="Desplazar materias a la izquierda"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/90 backdrop-blur disabled:opacity-30"
                          onClick={() => scrollMySubjects('right')}
                          disabled={!canScrollMySubjectsRight}
                          aria-label="Desplazar materias a la derecha"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>

                        <div
                          ref={mySubjectsScrollRef}
                          className="overflow-x-auto scrollbar-hide pb-1 px-10"
                        >
                          <div className="flex gap-3 min-w-max">
                            {teacherPrograms.map((program) => renderTeacherProgramCard(program, 'w-[220px] sm:w-[240px] shrink-0'))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>


                </Card>
              )}

              {teacherSection === 'crear' && (
                <Card className="p-4 rounded-2xl border border-border/60 bg-card/75 backdrop-blur-md shadow-[0_6px_30px_rgba(23,23,23,0.06)] space-y-4">
                  <div className="space-y-3">
                    <h2 className="text-lg font-bold">Paso 1: Selecciona una materia</h2>
                    <p className="text-sm text-muted-foreground">Elige una de tus materias o una materia de ejemplo para comenzar a crear el cuestionario.</p>

                    {teacherPrograms.length === 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Todavia no cargaste materias propias.</p>
                        <Button onClick={() => setShowUploadModal(true)}>
                          <Upload className="w-4 h-4 mr-2" />
                          Subir Programa
                        </Button>
                      </div>
                    )}

                    {teacherPrograms.length > 0 && (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {teacherPrograms.map((program) => renderTeacherProgramCard(program))}
                      </div>
                    )}
                  </div>

                  {selectedSubject && (
                    <div className="space-y-3 border-t pt-4">
                      <h2 className="text-lg font-bold">Paso 2: Elegir temas para el cuestionario</h2>
                      <SubjectContent subject={selectedSubject} />
                    </div>
                  )}
                </Card>
              )}

              {teacherSection === 'cuestionarios' && (
                <Card className="p-4 rounded-2xl border border-border/60 bg-card/75 backdrop-blur-md shadow-[0_6px_30px_rgba(23,23,23,0.06)] space-y-3">
                  <div className="space-y-2">
                    <h2 className="font-bold">Mis cuestionarios</h2>
                    <p className="text-sm text-muted-foreground">Se muestran todos tus cuestionarios. Usa el filtro para ver una materia puntual.</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={quizSubjectFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setQuizSubjectFilter('all')}
                      >
                        Todas las materias
                      </Button>
                      {teacherPrograms.map((program) => (
                        <Button
                          key={program.id}
                          variant={quizSubjectFilter === `teacher-${program.id}` ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setQuizSubjectFilter(`teacher-${program.id}`)}
                        >
                          {program.subjectName}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Tabs defaultValue="guardados">
                    <TabsList>
                      <TabsTrigger value="guardados">Guardados ({teacherQuizzes.length})</TabsTrigger>
                      <TabsTrigger value="realizados">Realizados ({performedQuizzes.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="guardados" className="space-y-2">
                      {teacherQuizzes.length === 0 && <p className="text-sm text-muted-foreground">No hay cuestionarios guardados para este filtro.</p>}
                      {teacherQuizzes.map((quiz) => (
                        <Card key={quiz.id} className="p-3 border">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold">{quiz.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {quiz.subjectName} | {quiz.mode} | {quiz.questionCount} preguntas | {quiz.status === 'pending_share' ? 'PENDIENTE_COMPARTIR' : 'GUARDADO'}
                                </p>
                              </div>
                              <Button size="sm" variant="ghost" onClick={() => setExpandedQuizId((prev) => (prev === quiz.id ? null : quiz.id))}>
                                <Eye className="w-4 h-4 mr-1" />
                                Ver detalle
                              </Button>
                            </div>

                            {expandedQuizId === quiz.id && (
                              <div className="space-y-1 text-sm bg-muted/40 rounded-md p-2">
                                <p><strong>Temas:</strong> {quiz.selectedTopics.map((topic) => topic.name).join(', ') || 'Sin temas'}</p>
                                <p><strong>Creado:</strong> {new Date(quiz.createdAt).toLocaleString('es-AR')}</p>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" variant="outline" onClick={() => handlePreviewQuiz(quiz)}>
                                <Eye className="w-4 h-4 mr-1" />
                                Previsualizar
                              </Button>
                              <Button size="sm" onClick={() => handleRunQuiz(quiz)}>
                                <PlayCircle className="w-4 h-4 mr-1" />
                                Realizar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={exportingQuizId === quiz.id}
                                onClick={() => handleExportQuiz(quiz)}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                {exportingQuizId === quiz.id ? 'Exportando...' : 'Exportar Moodle'}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteQuiz(quiz.id)}>
                                <Trash2 className="w-4 h-4 mr-1" />
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </TabsContent>
                    <TabsContent value="realizados" className="space-y-2">
                      {performedQuizzes.length === 0 && <p className="text-sm text-muted-foreground">No hay cuestionarios realizados para este filtro.</p>}
                      {performedQuizzes.map((attempt) => (
                        <Card key={String(attempt.id)} className="p-3 border">
                          <p className="font-semibold">{String(attempt.subject)}</p>
                          <p className="text-xs text-muted-foreground">
                            {String(attempt.mode)} | Nota: {String(attempt.score)} | Fecha: {new Date(String(attempt.completed_at)).toLocaleString('es-AR')}
                          </p>
                        </Card>
                      ))}
                    </TabsContent>
                  </Tabs>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>

      <TeacherProgramUploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onProgramCreated={addTeacherProgram}
      />

      <TeacherProgramUploadModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onProgramCreated={addTeacherProgram}
        onProgramUpdated={(program) => updateTeacherProgram(program.id, program)}
        programToEdit={activeTeacherProgram}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Esta seguro que desea eliminar esta materia?</AlertDialogTitle>
            <AlertDialogDescription>
              Una vez realizada esta accion no puede volverse atras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={handleDeleteActiveProgram}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
