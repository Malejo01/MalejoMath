'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MathBackground } from '@/components/math-background'
import { LaTeXRenderer } from '@/components/latex-renderer'
import { 
  ArrowLeft, 
  Calendar, 
  Trophy, 
  TrendingUp, 
  BookOpen, 
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lightbulb
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface QuizAttempt {
  id: string
  subject: string
  mode: string
  topics: string[]
  total_questions: number
  correct_answers: number
  score: number
  completed_at: string
}

interface TopicMastery {
  subject: string
  topic_id: string
  topic_name: string
  max_score: number
  attempts_count: number
  last_attempt_at: string
}

interface AttemptAnswer {
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

export default function HistoryPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [mastery, setMastery] = useState<TopicMastery[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null)
  const [attemptDetails, setAttemptDetails] = useState<Record<string, AttemptAnswer[]>>({})
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null)
  const [explanations, setExplanations] = useState<Record<string, string>>({})
  const [loadingExplanation, setLoadingExplanation] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return

    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/quiz/history')
        const data = await response.json()
        setAttempts(data.attempts || [])
        setMastery(data.mastery || [])
      } catch (error) {
        console.error('Error fetching history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [isLoaded, isSignedIn])

  const handleExpandAttempt = async (attemptId: string) => {
    if (expandedAttempt === attemptId) {
      setExpandedAttempt(null)
      return
    }

    setExpandedAttempt(attemptId)

    if (attemptDetails[attemptId]) return

    setLoadingDetails(attemptId)
    try {
      const response = await fetch(`/api/quiz/attempt/${attemptId}`)
      const data = await response.json()
      setAttemptDetails(prev => ({ ...prev, [attemptId]: data.answers || [] }))
    } catch (error) {
      console.error('Error fetching attempt details:', error)
    } finally {
      setLoadingDetails(null)
    }
  }

  const handleExplainError = async (answer: AttemptAnswer) => {
    const key = `${answer.id}`
    if (explanations[key]) return

    setLoadingExplanation(key)
    try {
      const response = await fetch('/api/explain-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: answer.question_text,
          selectedAnswer: answer.selected_answer,
          correctAnswer: answer.correct_answer,
          options: answer.options,
          topic: answer.topic_name
        })
      })
      const data = await response.json()
      setExplanations(prev => ({ ...prev, [key]: data.explanation }))
    } catch {
      setExplanations(prev => ({ ...prev, [key]: 'No se pudo cargar la explicacion.' }))
    } finally {
      setLoadingExplanation(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSubjectColor = (subject: string) => {
    if (subject.toLowerCase().includes('álgebra') || subject.toLowerCase().includes('algebra')) {
      return 'var(--algebra)'
    }
    if (subject.toLowerCase().includes('análisis') || subject.toLowerCase().includes('analisis')) {
      return 'var(--analysis)'
    }
    return 'var(--probability)'
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen relative">
        <MathBackground />
        <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10">
          <Card className="p-8 text-center border-2">
            <h1 className="text-2xl font-bold mb-4">Inicia sesion</h1>
            <p className="text-muted-foreground mb-6">
              Debes iniciar sesion para ver tu historial de evaluaciones.
            </p>
            <Link href="/sign-in">
              <Button className="w-full">Iniciar Sesion</Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <MathBackground />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b-2 border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Mi Historial</h1>
            <p className="text-sm text-muted-foreground">Tus evaluaciones y progreso</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 relative z-10 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Topic Mastery Section */}
            {mastery.length > 0 && (
              <section>
                <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[var(--probability)]" />
                  Dominio de Temas
                </h2>
                <div className="grid gap-2">
                  {mastery.map((item) => (
                    <Card 
                      key={`${item.subject}-${item.topic_id}`}
                      className="p-3 border-2"
                      style={{ borderColor: `${getSubjectColor(item.subject)}30` }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{item.topic_name}</p>
                          <p className="text-xs text-muted-foreground">{item.subject}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" style={{ color: getSubjectColor(item.subject) }} />
                            <span className="font-bold" style={{ color: getSubjectColor(item.subject) }}>
                              {item.max_score.toFixed(1)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.attempts_count} intento{item.attempts_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Quiz Attempts Section */}
            <section>
              <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[var(--algebra)]" />
                Evaluaciones Recientes
              </h2>
              
              {attempts.length === 0 ? (
                <Card className="p-8 text-center border-2">
                  <p className="text-muted-foreground">
                    Aun no has completado ninguna evaluacion.
                  </p>
                  <Link href="/">
                    <Button className="mt-4">Empezar a Practicar</Button>
                  </Link>
                </Card>
              ) : (
                <div className="space-y-3">
                  {attempts.map((attempt) => (
                    <Card 
                      key={attempt.id}
                      className="border-2 overflow-hidden"
                      style={{ borderColor: `${getSubjectColor(attempt.subject)}30` }}
                    >
                      <div 
                        className="p-4 cursor-pointer"
                        onClick={() => handleExpandAttempt(attempt.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span 
                                className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                                style={{ backgroundColor: getSubjectColor(attempt.subject) }}
                              >
                                {attempt.mode === 'teorico' ? 'Teorico' : 'Practico'}
                              </span>
                              <span className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-bold',
                                attempt.score >= 6 
                                  ? 'bg-[var(--analysis-light)] text-[var(--analysis)]'
                                  : 'bg-orange-100 text-orange-600'
                              )}>
                                {attempt.score >= 6 ? 'Aprobado' : 'Desaprobado'}
                              </span>
                            </div>
                            <p className="font-semibold">{attempt.subject}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(attempt.completed_at)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-2xl font-black" style={{ color: getSubjectColor(attempt.subject) }}>
                                {attempt.score.toFixed(1)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {attempt.correct_answers}/{attempt.total_questions}
                              </p>
                            </div>
                            {expandedAttempt === attempt.id ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedAttempt === attempt.id && (
                        <div className="border-t-2 border-border p-4 bg-muted/30">
                          {loadingDetails === attempt.id ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            </div>
                          ) : attemptDetails[attempt.id] ? (
                            <div className="space-y-3">
                              {attemptDetails[attempt.id].map((answer, i) => (
                                <div 
                                  key={answer.id}
                                  className={cn(
                                    'p-3 rounded-xl border-2',
                                    answer.is_correct 
                                      ? 'border-[var(--analysis)]/30 bg-[var(--analysis-light)]'
                                      : 'border-destructive/30 bg-destructive/5'
                                  )}
                                >
                                  <div className="flex items-start gap-2">
                                    {answer.is_correct ? (
                                      <CheckCircle className="w-5 h-5 text-[var(--analysis)] shrink-0" />
                                    ) : (
                                      <XCircle className="w-5 h-5 text-destructive shrink-0" />
                                    )}
                                    <div className="flex-1 space-y-2">
                                      <p className="text-sm font-medium">
                                        {i + 1}. <LaTeXRenderer content={answer.question_text} />
                                      </p>
                                      
                                      {!answer.is_correct && (
                                        <>
                                          <div className="text-xs space-y-1">
                                            <p className="text-destructive">
                                              Tu respuesta: {String.fromCharCode(65 + answer.selected_answer)}) <LaTeXRenderer content={answer.options[answer.selected_answer]} />
                                            </p>
                                            <p className="text-[var(--analysis)]">
                                              Correcta: {String.fromCharCode(65 + answer.correct_answer)}) <LaTeXRenderer content={answer.options[answer.correct_answer]} />
                                            </p>
                                          </div>

                                          {explanations[answer.id] && (
                                            <Card className="p-3 border border-[var(--algebra)]/30 bg-[var(--algebra-light)]">
                                              <div className="flex items-start gap-2">
                                                <Lightbulb className="w-4 h-4 text-[var(--algebra)] shrink-0 mt-0.5" />
                                                <div className="text-xs text-foreground/80 whitespace-pre-wrap">
                                                  <LaTeXRenderer content={explanations[answer.id]} />
                                                </div>
                                              </div>
                                            </Card>
                                          )}

                                          {!explanations[answer.id] && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleExplainError(answer)
                                              }}
                                              disabled={loadingExplanation === answer.id}
                                              className="gap-1 h-7 text-xs"
                                            >
                                              {loadingExplanation === answer.id ? (
                                                <>
                                                  <Loader2 className="w-3 h-3 animate-spin" />
                                                  Cargando...
                                                </>
                                              ) : (
                                                <>
                                                  <AlertCircle className="w-3 h-3" />
                                                  Explicar Error
                                                </>
                                              )}
                                            </Button>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-center text-muted-foreground text-sm">
                              No se pudieron cargar los detalles
                            </p>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
