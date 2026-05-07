'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { subjects } from '@/lib/data'
import { teacherProgramToSubject } from '@/lib/teacher-programs'
import { SubjectTabs } from './subject-tabs'
import { SubjectContent } from './subject-content'
import { WeakPointsSection } from './weak-points-section'
import { MathBackground } from './math-background'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navbar } from './navbar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  LineChart,
  BarChart3,
  BookOpen,
  Upload,
  Filter,
  Pencil,
  Trash2,
  Copy,
  PlayCircle,
  Eye,
} from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { TeacherProgramUploadModal } from './teacher-program-upload-modal'
import type { TeacherProgram, TeacherQuiz } from '@/lib/types'

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
  return {
    id: Number(quiz.id),
    userId: String(quiz.user_id || ''),
    teacherProgramId: Number(quiz.teacher_program_id || 0),
    title: String(quiz.title || 'Cuestionario docente'),
    subjectName: String(quiz.subject_name || ''),
    mode: quiz.mode === 'practico' ? 'practico' : 'teorico',
    status: quiz.status === 'pending_share' ? 'pending_share' : 'saved',
    selectedTopics: Array.isArray(quiz.selected_topics) ? (quiz.selected_topics as { id: string; name: string }[]) : [],
    questionCount: Number(quiz.question_count || 0),
    questions: Array.isArray(quiz.questions) ? (quiz.questions as TeacherQuiz['questions']) : [],
    pedagogyContext: quiz.pedagogy_context ? String(quiz.pedagogy_context) : undefined,
    createdAt: String(quiz.created_at || new Date().toISOString()),
    updatedAt: String(quiz.updated_at || new Date().toISOString()),
  }
}

export function Dashboard() {
  const {
    userProgress,
    userProfile,
    teacherPrograms,
    teacherQuizzes,
    teacherProgramFilters,
    clearSelectedTopics,
    setSelectedSubject,
    setTeacherPrograms,
    addTeacherProgram,
    updateTeacherProgram,
    removeTeacherProgram,
    setTeacherQuizzes,
    addTeacherQuiz,
    removeTeacherQuiz,
    setTeacherProgramFilters,
    startQuiz,
  } = useAppStore()
  const { isSignedIn } = useAuth()

  const [activeSubject, setActiveSubject] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showOnlyMySubjects, setShowOnlyMySubjects] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [performedQuizzes, setPerformedQuizzes] = useState<Record<string, unknown>[]>([])
  const [expandedQuizId, setExpandedQuizId] = useState<number | null>(null)
  const [editingQuizId, setEditingQuizId] = useState<number | null>(null)
  const [editingQuestions, setEditingQuestions] = useState<Record<number, TeacherQuiz['questions']>>({})

  const isTeacher = userProfile?.role === 'teacher'
  const teacherSubjects = teacherPrograms.map((program) => teacherProgramToSubject(program))
  const allSubjects = showOnlyMySubjects && isTeacher ? teacherSubjects : [...subjects, ...teacherSubjects]

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
          .map((program) => normalizeTeacherProgram(program as TeacherProgramApiShape))

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

  const selectedSubject = allSubjects.find((subject) => subject.id === activeSubject)

  useEffect(() => {
    if (!isTeacher || !selectedSubject?.programId) {
      setTeacherQuizzes([])
      setPerformedQuizzes([])
      return
    }

    let isMounted = true

    const loadSubjectQuizzes = async () => {
      try {
        const quizzesQuery = new URLSearchParams()
        quizzesQuery.set('programId', String(selectedSubject.programId))
        if (teacherProgramFilters.mode) quizzesQuery.set('mode', teacherProgramFilters.mode)
        if (teacherProgramFilters.createdAfter) quizzesQuery.set('createdAfter', teacherProgramFilters.createdAfter)

        const [savedRes, historyRes] = await Promise.all([
          fetch(`/api/teacher/quizzes?${quizzesQuery.toString()}`),
          fetch(`/api/quiz/history?subject=${encodeURIComponent(selectedSubject.name)}&mode=${encodeURIComponent(teacherProgramFilters.mode)}&createdAfter=${encodeURIComponent(teacherProgramFilters.createdAfter)}`),
        ])

        const savedData = await savedRes.json()
        const historyData = await historyRes.json()

        if (!isMounted) {
          return
        }

        if (savedRes.ok) {
          const normalizedQuizzes = (Array.isArray(savedData.quizzes) ? savedData.quizzes : []).map((quiz) => normalizeTeacherQuiz(quiz as Record<string, unknown>))
          setTeacherQuizzes(normalizedQuizzes)
        } else {
          setTeacherQuizzes([])
        }

        if (historyRes.ok) {
          setPerformedQuizzes(Array.isArray(historyData.attempts) ? historyData.attempts : [])
        } else {
          setPerformedQuizzes([])
        }
      } catch {
        if (isMounted) {
          setTeacherQuizzes([])
          setPerformedQuizzes([])
        }
      }
    }

    loadSubjectQuizzes()

    return () => {
      isMounted = false
    }
  }, [isTeacher, selectedSubject?.programId, selectedSubject?.name, teacherProgramFilters.mode, teacherProgramFilters.createdAfter, setTeacherQuizzes])

  const handleSubjectChange = (subjectId: string | null) => {
    setActiveSubject(subjectId)
    setSelectedSubject(subjectId)
    setExpandedQuizId(null)
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

  const handleDuplicateQuiz = async (quizId: number) => {
    try {
      const response = await fetch(`/api/teacher/quizzes/${quizId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate' }),
      })

      const data = await response.json()
      if (!response.ok) return
      addTeacherQuiz(normalizeTeacherQuiz(data.quiz as Record<string, unknown>))
    } catch {
      // noop
    }
  }

  const handleStartManualEditQuiz = (quiz: TeacherQuiz) => {
    setEditingQuizId(quiz.id)
    setExpandedQuizId(quiz.id)
    setEditingQuestions((prev) => ({ ...prev, [quiz.id]: quiz.questions.map((question) => ({ ...question })) }))
  }

  const handleManualQuestionChange = (quizId: number, questionId: string, value: string) => {
    setEditingQuestions((prev) => ({
      ...prev,
      [quizId]: (prev[quizId] || []).map((question) =>
        question.id === questionId ? { ...question, question: value } : question
      ),
    }))
  }

  const handleSaveManualQuiz = async (quiz: TeacherQuiz) => {
    const draftQuestions = editingQuestions[quiz.id]
    if (!draftQuestions || draftQuestions.length === 0) return

    try {
      const response = await fetch(`/api/teacher/quizzes/${quiz.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: draftQuestions }),
      })

      const data = await response.json()
      if (!response.ok) return

      const updatedQuiz = normalizeTeacherQuiz(data.quiz as Record<string, unknown>)
      setTeacherQuizzes(teacherQuizzes.map((currentQuiz) => (currentQuiz.id === updatedQuiz.id ? updatedQuiz : currentQuiz)))
      setEditingQuizId(null)
    } catch {
      // noop
    }
  }

  const handlePreviewQuiz = (quiz: TeacherQuiz) => {
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

  return (
    <div className="min-h-screen relative">
      <MathBackground />

      <Navbar />

      <main className="px-4 py-5 pb-8 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 border-2 border-border bg-card/80 backdrop-blur-sm">
            <div className="flex flex-col items-center text-center gap-1">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${currentAverageCard.iconBg}`}>
                <AverageIcon className={`w-5 h-5 ${currentAverageCard.iconText}`} />
              </div>
              <div className="text-lg font-black text-foreground leading-none">
                {activeSubject ? selectedSubjectAverage.toFixed(2) : '--'}
              </div>
              <div className="text-[10px] text-muted-foreground font-semibold leading-tight">
                {currentAverageCard.title}
              </div>
              <div className="text-[10px] text-muted-foreground/80">
                {activeSubject ? `${selectedSubjectAttempts} evaluaciones` : 'Sin materia elegida'}
              </div>
            </div>
          </Card>

          <Card className="p-3 border-2 border-border bg-card/80 backdrop-blur-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-9 h-9 rounded-xl bg-[var(--analysis-light)] flex items-center justify-center mb-1.5">
                <TrendingUp className="w-5 h-5 text-[var(--analysis)]" />
              </div>
              <div className="text-xl font-black text-foreground">{totalProgress}%</div>
              <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Progreso</div>
            </div>
          </Card>

          <Card className="p-3 border-2 border-border bg-card/80 backdrop-blur-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-9 h-9 rounded-xl bg-[var(--probability-light)] flex items-center justify-center mb-1.5">
                <Target className="w-5 h-5 text-[var(--probability)]" />
              </div>
              <div className="text-xl font-black text-foreground">{userProgress.weakPoints.length}</div>
              <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Reforzar</div>
            </div>
          </Card>
        </div>

        <section>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">
            Materias
          </h2>

          {isTeacher && (
            <Card className="p-3 mb-3 space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  variant={showFilters ? 'default' : 'outline'}
                  onClick={() => setShowFilters((prev) => !prev)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
                <Button onClick={() => setShowUploadModal(true)} className="rounded-xl font-bold">
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Programa
                </Button>
              </div>
              {showFilters && (
                <div className="space-y-3">
                  <Button
                    variant={showOnlyMySubjects ? 'default' : 'outline'}
                    onClick={() => setShowOnlyMySubjects((prev) => !prev)}
                  >
                    Mis materias
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
                      onChange={(event) => setTeacherProgramFilters({ mode: event.target.value as '' | 'teorico' | 'practico' })}
                    >
                      <option value="">Modo (todos)</option>
                      <option value="teorico">Teorico</option>
                      <option value="practico">Practico</option>
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
            </Card>
          )}

          <SubjectTabs
            subjects={allSubjects}
            activeSubject={activeSubject}
            onSelect={handleSubjectChange}
          />
        </section>

        {selectedSubject && (
          <section className="mt-2 space-y-4">
            {selectedSubject.source === 'teacher' && activeTeacherProgram && (
              <Card className="p-3 border-2 border-border bg-card/80 backdrop-blur-sm space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowEditModal(true)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button type="button" variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                </div>

                <Tabs defaultValue="guardados">
                  <TabsList>
                    <TabsTrigger value="guardados">Guardados ({teacherQuizzes.length})</TabsTrigger>
                    <TabsTrigger value="realizados">Realizados ({performedQuizzes.length})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="guardados" className="space-y-2">
                    {teacherQuizzes.length === 0 && <p className="text-sm text-muted-foreground">No hay cuestionarios guardados para esta materia.</p>}
                    {teacherQuizzes.map((quiz) => (
                      <Card key={quiz.id} className="p-3 border">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold">{quiz.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {quiz.mode} | {quiz.questionCount} preguntas | {quiz.status === 'pending_share' ? 'PENDIENTE_COMPARTIR' : 'GUARDADO'}
                              </p>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => setExpandedQuizId((prev) => (prev === quiz.id ? null : quiz.id))}>
                              <Eye className="w-4 h-4 mr-1" />
                              Ver detalle
                            </Button>
                          </div>

                          {expandedQuizId === quiz.id && (
                            <div className="space-y-2 text-sm bg-muted/40 rounded-md p-2">
                              {(editingQuizId === quiz.id ? (editingQuestions[quiz.id] || []) : quiz.questions).slice(0, 5).map((question) => (
                                <div key={question.id} className="space-y-1">
                                  {editingQuizId === quiz.id ? (
                                    <textarea
                                      className="w-full rounded-md border px-2 py-1 text-xs bg-background"
                                      value={question.question}
                                      onChange={(event) => handleManualQuestionChange(quiz.id, question.id, event.target.value)}
                                    />
                                  ) : (
                                    <p>- {question.question}</p>
                                  )}
                                </div>
                              ))}
                              {quiz.questions.length > 5 && <p className="text-muted-foreground">...y {quiz.questions.length - 5} mas</p>}
                              {editingQuizId === quiz.id && (
                                <div className="flex gap-2 pt-2">
                                  <Button size="sm" onClick={() => handleSaveManualQuiz(quiz)}>Guardar edicion</Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingQuizId(null)}>Cancelar</Button>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => handlePreviewQuiz(quiz)}>
                              <PlayCircle className="w-4 h-4 mr-1" />
                              Realizar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDuplicateQuiz(quiz.id)}>
                              <Copy className="w-4 h-4 mr-1" />
                              Duplicar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleStartManualEditQuiz(quiz)}>
                              <Pencil className="w-4 h-4 mr-1" />
                              Editar manualmente
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
                    {performedQuizzes.length === 0 && <p className="text-sm text-muted-foreground">No hay cuestionarios realizados para esta materia.</p>}
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

            <SubjectContent subject={selectedSubject} />
          </section>
        )}

        {userProgress.weakPoints.length > 0 && (
          <WeakPointsSection weakPoints={userProgress.weakPoints} />
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
