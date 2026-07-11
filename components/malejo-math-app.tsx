'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useAppStore } from '@/lib/store'
import { Dashboard } from './dashboard'
import { QuizEngine } from './quiz-engine'
import { ResultsScreen } from './results-screen'
import { LoadingScreen } from './loading-screen'
import { OnboardingScreen } from './onboarding-screen'
import { CurriculumSelector, type CurriculumSelection } from './curriculum-selector'
import { TeacherQuizGenerated } from './teacher-quiz-generated'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'
import type { Question } from '@/lib/types'

export function MalejoMathApp() {
  const {
    activeView,
    resetQuiz,
    setActiveView,
    startQuiz,
    currentQuiz,
    updateStreak,
    updateSubjectAverage,
    addWeakPoint,
  } = useAppStore()
  const { data: session, status } = useSession()
  const { toast } = useToast()

  // DOCENTE-specific state: generated questions pending review
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[] | null>(null)
  const [lastSelection, setLastSelection] = useState<CurriculumSelection | null>(null)
  const [forceOnboarded, setForceOnboarded] = useState(false)
  const [statsUpdatedForQuizId, setStatsUpdatedForQuizId] = useState<string | null>(null)

  useEffect(() => {
    resetQuiz()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update Zustand store stats when quiz ends and we show the results screen
  useEffect(() => {
    if (activeView === 'results' && currentQuiz.config && currentQuiz.answers.length > 0) {
      const attemptId = `${currentQuiz.config.subject}-${currentQuiz.answers.length}-${currentQuiz.startedAt}`
      if (statsUpdatedForQuizId !== attemptId) {
        setStatsUpdatedForQuizId(attemptId)

        const { answers, config, questions } = currentQuiz
        const correctAnswers = answers.filter(a => a.isCorrect)
        const incorrectAnswers = answers.filter(a => !a.isCorrect)
        const correct = correctAnswers.length
        const total = questions.length
        const score = Number(((correct / total) * 10).toFixed(2))

        // Update streak
        const passed = score >= 6
        updateStreak(passed)

        // Add average and weak points for incorrect answers
        updateSubjectAverage(config.subject, score)

        incorrectAnswers.forEach(a => {
          if (a.topic && a.topicName) {
            addWeakPoint(a.topic, a.topicName, config.subject)
          }
        })
      }
    }
  }, [activeView, currentQuiz, statsUpdatedForQuizId, updateStreak, updateSubjectAverage, addWeakPoint])

  if (status === 'loading') return null

  // First-time onboarding
  if (status === 'authenticated' && !session?.user?.isOnboarded && !forceOnboarded) {
    return (
      <>
        <OnboardingScreen onComplete={() => setForceOnboarded(true)} />
        <Toaster />
      </>
    )
  }

  const isDocente = session?.user?.role === 'DOCENTE'

  // ── Shared quiz generation logic ───────────────────────────────────────────
  const generateQuiz = async (selection: CurriculumSelection): Promise<Question[]> => {
    // Build subjectUnits from eje → temas grouping in selectedTopics
    const ejesMap = new Map<string, string[]>()
    for (const t of selection.selectedTopics) {
      if (!ejesMap.has(t.eje)) ejesMap.set(t.eje, [])
      ejesMap.get(t.eje)!.push(t.name)
    }
    const subjectUnits = Array.from(ejesMap.entries()).map(([eje, temas]) => ({
      id: eje, name: eje,
      topics: temas.map((n) => ({ id: n, name: n })),
    }))

    const res = await fetch('/api/generate-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: selection.materia,
        subjectSource: 'teacher',    // reuses teacher path → buildCurriculumFromUnits
        subjectUnits,
        topics: selection.selectedTopics.map((t) => ({ id: t.id, name: t.name })),
        mode: selection.mode,
        questionCount: selection.questionCount,
        pedagogyContext: [
          `Nivel: ${selection.nivel}`,
          selection.grado ? `Grado/Año: ${selection.grado}` : null,
          `Dificultad: ${selection.difficulty}`,
        ].filter(Boolean).join(' | '),
      }),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${res.status}`)
    }

    const data = await res.json()
    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      throw new Error('La IA no pudo estructurar preguntas válidas para los temas seleccionados.')
    }
    return data.questions as Question[]
  }

  // ── CTA from CurriculumSelector ─────────────────────────────────────────────
  const handleStartQuiz = async (selection: CurriculumSelection) => {
    setLastSelection(selection)
    setActiveView('loading')

    try {
      const questions = await generateQuiz(selection)

      if (isDocente) {
        // DOCENTE: show generated questions for review/edit/export
        setGeneratedQuestions(questions)
        setActiveView('dashboard') // placeholder — overridden by generatedQuestions guard below
        setGeneratedQuestions(questions) // signals the preview
      } else {
        // ALUMNO: start quiz directly
        startQuiz(
          {
            subject: selection.materia,
            subjectName: selection.materia,
            topics: selection.selectedTopics.map((t) => ({ id: t.id, name: t.name })),
            mode: selection.mode,
            questionCount: questions.length,
          },
          questions,
        )
        setActiveView('quiz')
      }
    } catch (err) {
      console.error('Error generating quiz:', err)
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      toast({
        variant: 'destructive',
        title: 'Error de Generación',
        description: `No pudimos generar tu cuestionario: ${errorMsg}. Por favor, vuelve a intentarlo en unos instantes.`,
      })
      setActiveView('selector')
    }
  }

  // DOCENTE review screen (overrides normal routing when questions are ready)
  if (isDocente && generatedQuestions && generatedQuestions.length > 0 && lastSelection) {
    return (
      <>
        <TeacherQuizGenerated
          questions={generatedQuestions}
          selection={lastSelection}
          onBack={() => {
            setGeneratedQuestions(null)
            setActiveView('selector')
          }}
        />
        <Toaster />
      </>
    )
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen">
      {activeView === 'dashboard' && <Dashboard />}
      {activeView === 'selector' && (
        <CurriculumSelector
          onStartQuiz={handleStartQuiz}
          onCancel={() => setActiveView('dashboard')}
        />
      )}
      {activeView === 'loading' && <LoadingScreen />}
      {activeView === 'quiz' && <QuizEngine />}
      {activeView === 'results' && <ResultsScreen />}
      <Toaster />
    </div>
  )
}


