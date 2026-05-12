'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Check, ChevronDown, ChevronUp, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Subject, Topic } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { QuizModeDialog } from './quiz-mode-dialog'
import { pedagogyProfileToContext } from '@/lib/teacher-programs'
import { QuizActionDialog } from './quiz-action-dialog'
import type { ProgramUnit, Question, QuizActionMode, SubjectColorName, SubjectIconName } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

interface SubjectContentProps {
  subject: Subject
}

const colorConfig = {
  algebra: {
    bg: 'bg-[var(--algebra)]',
    bgLight: 'bg-[var(--algebra-light)]',
    text: 'text-[var(--algebra)]',
    border: 'border-[var(--algebra)]',
    borderLight: 'border-[var(--algebra)]/30',
    gradient: 'from-[var(--algebra)] to-[var(--algebra)]/80',
  },
  analisis: {
    bg: 'bg-[var(--analysis)]',
    bgLight: 'bg-[var(--analysis-light)]',
    text: 'text-[var(--analysis)]',
    border: 'border-[var(--analysis)]',
    borderLight: 'border-[var(--analysis)]/30',
    gradient: 'from-[var(--analysis)] to-[var(--analysis)]/80',
  },
  probabilidad: {
    bg: 'bg-[var(--probability)]',
    bgLight: 'bg-[var(--probability-light)]',
    text: 'text-[var(--probability)]',
    border: 'border-[var(--probability)]',
    borderLight: 'border-[var(--probability)]/30',
    gradient: 'from-[var(--probability)] to-[var(--probability)]/80',
  }
}

export function SubjectContent({ subject }: SubjectContentProps) {
  const { selectedTopics, toggleTopic, setActiveView, startQuiz, getUsedQuestionIds, addTeacherQuiz, userProfile } = useAppStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showModeDialog, setShowModeDialog] = useState(false)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [selectedMode, setSelectedMode] = useState<'teorico' | 'practico' | null>(null)
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({})
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const { toast } = useToast()
  
  const colors = colorConfig[subject.id as keyof typeof colorConfig] || colorConfig.algebra
  const pedagogyContext = subject.pedagogyProfile
    ? pedagogyProfileToContext(subject.pedagogyProfile)
    : undefined

  const totalTopics = subject.units.reduce((acc, unit) => acc + unit.topics.length, 0)
  const completedTopics = subject.units.reduce(
    (acc, unit) => acc + unit.topics.filter(t => t.completed).length, 
    0
  )
  const progressPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0

  const exampleAppearanceMap: Record<string, { iconName: SubjectIconName; colorName: SubjectColorName }> = {
    algebra: { iconName: 'sigma', colorName: 'blue' },
    analisis: { iconName: 'chart-line', colorName: 'green' },
    probabilidad: { iconName: 'pie-chart', colorName: 'amber' },
  }

  const toProgramUnits = (): ProgramUnit[] => {
    return subject.units.map((unit, unitIndex) => ({
      id: unit.id || `u-${unitIndex + 1}`,
      name: unit.name,
      topics: unit.topics.reduce((acc, topic, topicIndex) => {
        const groupName = topic.group || topic.name
        const existing = acc.find((group) => group.name === groupName)

        const subtopic = {
          id: topic.id,
          name: topic.name,
        }

        if (existing) {
          existing.subtopics.push(subtopic)
        } else {
          acc.push({
            id: `${unit.id || `u-${unitIndex + 1}`}-t-${topicIndex + 1}`,
            name: groupName,
            subtopics: [subtopic],
          })
        }

        return acc
      }, [] as ProgramUnit[number]['topics']),
    }))
  }

  const resolveTeacherProgramId = async (): Promise<number> => {
    if (subject.source === 'teacher' && subject.programId) {
      return subject.programId
    }

    const lookupResponse = await fetch(`/api/teacher/programs?name=${encodeURIComponent(subject.name)}`)
    const lookupData = await lookupResponse.json()

    if (lookupResponse.ok && Array.isArray(lookupData.programs)) {
      const exactProgram = lookupData.programs.find((program: { subject_name?: string; subjectName?: string; id: number }) => {
        const currentName = String(program.subjectName || program.subject_name || '').trim().toLowerCase()
        return currentName === subject.name.trim().toLowerCase()
      })

      if (exactProgram?.id) {
        return Number(exactProgram.id)
      }
    }

    const appearance = exampleAppearanceMap[subject.id] || { iconName: 'book-open' as SubjectIconName, colorName: 'teal' as SubjectColorName }
    const createResponse = await fetch('/api/teacher/programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subjectName: subject.name,
        iconName: appearance.iconName,
        colorName: appearance.colorName,
        units: toProgramUnits(),
        pedagogyProfile: {
          level: 'Universitario',
          degree: 'General',
          academicYear: 'No especificado',
          complexity: 'Intermedio',
          assessmentStyle: 'mixto',
          methodology: 'Generado desde materia ejemplo',
        },
      }),
    })

    const createData = await createResponse.json()
    if (!createResponse.ok || !createData?.program?.id) {
      const details = createData?.details ? ` (${createData.details})` : ''
      throw new Error(`${createData?.error || 'No se pudo preparar la materia para guardar cuestionarios'}${details}`)
    }

    return Number(createData.program.id)
  }

  const generateQuestions = async (mode: 'teorico' | 'practico'): Promise<Question[] | null> => {
    if (selectedTopics.length === 0) return null

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.name,
          topics: selectedTopics,
          mode,
          pedagogyContext,
          previousQuestionIds: getUsedQuestionIds()
        })
      })
      
      const data = await response.json()

      if (data.questions && data.questions.length === 10) {
        return data.questions as Question[]
      }

      console.error('No questions received:', data.error)
      return null
    } catch (error) {
      console.error('Quiz generation error:', error)
      return null
    }
  }

  const saveTeacherQuiz = async ({
    mode,
    questions,
    status,
  }: {
    mode: 'teorico' | 'practico'
    questions: Question[]
    status: 'saved' | 'pending_share'
  }) => {
    const teacherProgramId = await resolveTeacherProgramId()

    const response = await fetch('/api/teacher/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teacherProgramId,
        title: `${subject.name} - ${mode === 'teorico' ? 'Teorico' : 'Practico'} - ${new Date().toLocaleDateString('es-AR')}`,
        subjectName: subject.name,
        mode,
        status,
        selectedTopics,
        questionCount: questions.length,
        questions,
        pedagogyContext,
      })
    })

    const data = await response.json()
    if (!response.ok) {
      const details = data?.details ? ` (${data.details})` : ''
      throw new Error(`${data?.error || 'No se pudo guardar el cuestionario'}${details}`)
    }

    addTeacherQuiz({
      id: data.quiz.id,
      userId: data.quiz.user_id,
      teacherProgramId: data.quiz.teacher_program_id,
      title: data.quiz.title,
      subjectName: data.quiz.subject_name,
      mode: data.quiz.mode,
      status: data.quiz.status,
      selectedTopics: data.quiz.selected_topics,
      questionCount: data.quiz.question_count,
      questions: data.quiz.questions,
      pedagogyContext: data.quiz.pedagogy_context || undefined,
      createdAt: data.quiz.created_at,
      updatedAt: data.quiz.updated_at,
    })

    toast({
      title: '¡Tu cuestionario ya fue creado!',
      description: status === 'saved'
        ? 'Lo veras debajo de esta materia en la pestana Guardados.'
        : 'Quedo marcado como pendiente para compartir.',
    })
  }

  const handleStartQuiz = async (mode: 'teorico' | 'practico') => {
    setSelectedMode(mode)
    setShowModeDialog(false)

    if (userProfile?.role !== 'teacher') {
      await handleActionSelection('realizar', mode)
      return
    }

    setShowActionDialog(true)
  }

  const handleActionSelection = async (action: QuizActionMode, forcedMode?: 'teorico' | 'practico') => {
    const effectiveMode = forcedMode || selectedMode
    if (!effectiveMode) return

    setIsLoading(true)
    setShowActionDialog(false)
    setActiveView('loading')

    try {
      const generatedQuestions = await generateQuestions(effectiveMode)
      if (!generatedQuestions || generatedQuestions.length === 0) {
        toast({ title: 'No se pudo generar el cuestionario', description: 'Intenta nuevamente.' })
        setActiveView('dashboard')
        return
      }

      if (action === 'realizar') {
        startQuiz(
          {
            subject: subject.id,
            subjectName: subject.name,
            topics: selectedTopics,
            mode: effectiveMode,
            questionCount: generatedQuestions.length,
            pedagogyContext,
          },
          generatedQuestions
        )
        return
      }

      const status = action === 'guardar' ? 'saved' : 'pending_share'
      await saveTeacherQuiz({ mode: effectiveMode, questions: generatedQuestions, status })
      setActiveView('dashboard')
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error desconocido',
      })
      setActiveView('dashboard')
    } finally {
      setIsLoading(false)
      setSelectedMode(null)
    }
  }

  const selectedIds = new Set(selectedTopics.map(t => t.id))

  const toggleGroup = (topics: Topic[]) => {
    const allSelected = topics.every(t => selectedIds.has(t.id))
    topics.forEach((topic) => {
      const isSelected = selectedIds.has(topic.id)
      if (allSelected && isSelected) toggleTopic(topic.id, topic.name)
      if (!allSelected && !isSelected) toggleTopic(topic.id, topic.name)
    })
  }

  return (
    <div className="space-y-5 animate-in fade-in-50 slide-in-from-bottom-4 duration-300">
      {/* Subject Header Card */}
      <Card className={cn('overflow-hidden border-2', colors.borderLight)}>
        <div className={cn('bg-gradient-to-r p-4 text-white', colors.gradient)}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{subject.name}</h2>
              <p className="text-white/80 text-sm">{subject.units.length} unidades</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black">{Math.round(progressPercentage)}%</div>
              <div className="text-white/80 text-xs">completado</div>
            </div>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2.5 mt-3 bg-white/30 [&>div]:bg-white"
          />
        </div>
      </Card>

      {/* Selected count */}
      {selectedTopics.length > 0 && (
        <div className="text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold border-2 border-emerald-300">
            <Check className="w-4 h-4" />
            {selectedTopics.length} tema{selectedTopics.length !== 1 ? 's' : ''} seleccionado{selectedTopics.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Units List */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Elegir temas para el cuestionario</h3>
        <p className="text-sm text-muted-foreground">Selecciona los temas que quieras incluir en la generacion.</p>
      </div>

      <div className="space-y-6">
        {subject.units.map((unit, unitIndex) => {
          const groupedTopics = unit.topics.reduce<{ group: string; topics: Topic[] }[]>((acc, topic) => {
            const groupName = topic.group ?? ''
            const lastGroup = acc[acc.length - 1]

            if (!lastGroup || lastGroup.group !== groupName) {
              acc.push({ group: groupName, topics: [topic] })
            } else {
              lastGroup.topics.push(topic)
            }

            return acc
          }, [])

          const isExpanded = expandedUnits[unit.id] ?? false

          const toggleUnitExpanded = () => {
            setExpandedUnits(prev => ({
              ...prev,
              [unit.id]: !isExpanded
            }))
          }

          return (
            <div key={unit.id} className="space-y-3">
              {/* Unit Header */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleGroup(unit.topics)}
                  className={cn(
                    'flex-1 flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors',
                    colors.bgLight,
                    'border-2',
                    colors.borderLight
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-lg',
                    colors.bg
                  )}>
                    {unitIndex + 1}
                  </div>
                  <h3 className="font-bold text-foreground text-base">
                    Unidad {unitIndex + 1}: {unit.name.replace(/^Unidad\s+[IVX]+:\s*/i, '')}
                  </h3>
                </button>
                <button
                  type="button"
                  onClick={toggleUnitExpanded}
                  className={cn(
                    'h-12 w-12 rounded-xl border-2 flex items-center justify-center transition-colors',
                    colors.bgLight,
                    colors.borderLight,
                    'hover:border-muted-foreground/50'
                  )}
                  aria-label={isExpanded ? 'Ocultar subtemas' : 'Mostrar subtemas'}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>

              {isExpanded && (
                <div className="space-y-3">
                  {groupedTopics.map((group) => {
                  const selectedCount = group.topics.filter(topic => selectedIds.has(topic.id)).length
                  const allSelected = selectedCount === group.topics.length
                  const someSelected = selectedCount > 0 && !allSelected
                    const groupKey = `${unit.id}:${group.group || group.topics[0].id}`
                    const isGroupExpanded = expandedGroups[groupKey] ?? true

                    const toggleGroupExpanded = () => {
                      setExpandedGroups(prev => ({
                        ...prev,
                        [groupKey]: !isGroupExpanded
                      }))
                    }

                  return (
                    <div key={group.group || group.topics[0].id} className="space-y-2">
                        {group.group && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleGroup(group.topics)}
                              className={cn(
                                'flex-1 flex items-center justify-between gap-2 px-3 py-2 rounded-xl border-2 text-xs font-bold',
                                allSelected && 'bg-emerald-400 border-foreground text-foreground',
                                someSelected && !allSelected && 'bg-emerald-100 border-emerald-400 text-foreground',
                                !selectedCount && 'bg-white border-border text-muted-foreground'
                              )}
                            >
                              <span>{group.group}</span>
                              <span>{selectedCount}/{group.topics.length}</span>
                            </button>
                            <button
                              type="button"
                              onClick={toggleGroupExpanded}
                              className={cn(
                                'h-9 w-9 rounded-xl border-2 flex items-center justify-center transition-colors',
                                colors.bgLight,
                                colors.borderLight,
                                'hover:border-muted-foreground/50'
                              )}
                              aria-label={isGroupExpanded ? 'Ocultar subtemas' : 'Mostrar subtemas'}
                            >
                              {isGroupExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )}

                        {isGroupExpanded && (
                          <div className="grid gap-2 pl-2">
                            {group.topics.map((topic) => {
                              const isSelected = selectedIds.has(topic.id)

                              return (
                                <button
                                  key={topic.id}
                                  onClick={() => toggleTopic(topic.id, topic.name)}
                                  className={cn(
                                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                                    'border-2',
                                    isSelected
                                      ? 'bg-emerald-400 border-foreground shadow-md'
                                      : 'bg-white border-border hover:border-muted-foreground/50 hover:bg-muted/30'
                                  )}
                                >
                                  <div className={cn(
                                    'w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
                                    isSelected
                                      ? 'bg-foreground border-foreground'
                                      : 'border-muted-foreground/40 bg-white'
                                  )}>
                                    {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                                  </div>
                                  <span className={cn(
                                    'flex-1 font-medium text-sm',
                                    isSelected ? 'text-foreground font-semibold' : 'text-muted-foreground'
                                  )}>
                                    {topic.name}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                    </div>
                  )
                })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Start Quiz Button - Fixed at bottom when topics selected */}
      {selectedTopics.length > 0 && (
        <div className="sticky bottom-4 pt-4">
          <Button
            onClick={() => setShowModeDialog(true)}
            disabled={isLoading}
            className={cn(
              'w-full h-14 text-lg font-bold gap-3 rounded-2xl shadow-xl transition-all',
              'bg-gradient-to-r from-[var(--algebra)] to-[var(--analysis)] text-white border-0',
              'disabled:opacity-50',
              'hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
            )}
            size="lg"
          >
            <Play className="w-5 h-5" />
            Empezar Cuestionario
          </Button>
        </div>
      )}

      <QuizModeDialog
        open={showModeDialog}
        onOpenChange={setShowModeDialog}
        onSelectMode={handleStartQuiz}
        isLoading={isLoading}
        title="Empezar cuestionario"
        description="Selecciona el tipo de examen y se generaran 10 preguntas con los temas que elegiste."
      />

      {userProfile?.role === 'teacher' && (
        <QuizActionDialog
          open={showActionDialog}
          onOpenChange={setShowActionDialog}
          onSelectAction={handleActionSelection}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
