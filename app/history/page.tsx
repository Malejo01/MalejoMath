'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@clerk/nextjs'
import { UserButton } from '@clerk/nextjs'
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
  Lightbulb,
  GraduationCap,
  BarChart3,
  Sigma,
  LineChart,
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

type SubjectFilter = 'all' | 'algebra' | 'analisis' | 'probabilidad'
type ModeFilter = 'all' | 'teorico' | 'practico'

function getSubjectKey(subject: string): SubjectFilter {
  const s = subject.toLowerCase()
  if (s.includes('álgebra') || s.includes('algebra')) return 'algebra'
  if (s.includes('análisis') || s.includes('analisis')) return 'analisis'
  if (s.includes('probabilidad') || s.includes('estadística')) return 'probabilidad'
  return 'all'
}

const subjectColorVar: Record<string, string> = {
  algebra: 'var(--algebra)',
  analisis: 'var(--analysis)',
  probabilidad: 'var(--probability)',
}

const subjectLightVar: Record<string, string> = {
  algebra: 'var(--algebra-light)',
  analisis: 'var(--analysis-light)',
  probabilidad: 'var(--probability-light)',
}

const subjectIcon: Record<string, React.ElementType> = {
  algebra: Sigma,
  analisis: LineChart,
  probabilidad: BarChart3,
}

const subjectLabel: Record<string, string> = {
  all: 'Todas',
  algebra: 'Álgebra',
  analisis: 'Análisis',
  probabilidad: 'Probabilidad',
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
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>('all')
  const [modeFilter, setModeFilter] = useState<ModeFilter>('all')

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

  const filteredAttempts = useMemo(() => {
    return attempts.filter((a) => {
      const subjectMatch =
        subjectFilter === 'all' || getSubjectKey(a.subject) === subjectFilter
      const modeMatch = modeFilter === 'all' || a.mode === modeFilter
      return subjectMatch && modeMatch
    })
  }, [attempts, subjectFilter, modeFilter])

  // Stats derived from ALL attempts (no filters)
  const stats = useMemo(() => {
    const total = attempts.length
    const passed = attempts.filter((a) => Number(a.score) >= 6).length
    const avg =
      total > 0
        ? attempts.reduce((s, a) => s + Number(a.score), 0) / total
        : 0
    return { total, passed, avg }
  }, [attempts])

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

  const getSubjectColor = (subject: string) =>
    subjectColorVar[getSubjectKey(subject)] ?? 'var(--algebra)'

  const getSubjectLight = (subject: string) =>
    subjectLightVar[getSubjectKey(subject)] ?? 'var(--algebra-light)'

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
          <Card className="p-8 text-center border-2 bg-card/80 backdrop-blur-sm">
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

      {/* ── Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-md">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-black text-foreground leading-none">Historial</h1>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  Mis evaluaciones
                </p>
              </div>
            </div>
          </div>
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: 'w-9 h-9 border-2 border-primary/20 hover:border-primary transition-colors',
                userButtonTrigger: 'focus:shadow-none focus:outline-none',
              },
            }}
          />
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────── */}
      <main className="max-w-lg mx-auto px-4 py-5 pb-10 space-y-5 relative z-10">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* ── Stats row ───────────────────────────── */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-3 border-2 border-border bg-card/80 backdrop-blur-sm">
                <div className="flex flex-col items-center text-center gap-1">
                  <div className="w-9 h-9 rounded-xl bg-[var(--algebra-light)] flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-[var(--algebra)]" />
                  </div>
                  <div className="text-xl font-black text-foreground leading-none">{stats.total}</div>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide leading-tight">
                    Evaluaciones
                  </div>
                </div>
              </Card>

              <Card className="p-3 border-2 border-border bg-card/80 backdrop-blur-sm">
                <div className="flex flex-col items-center text-center gap-1">
                  <div className="w-9 h-9 rounded-xl bg-[var(--analysis-light)] flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-[var(--analysis)]" />
                  </div>
                  <div className="text-xl font-black text-foreground leading-none">
                    {stats.avg > 0 ? stats.avg.toFixed(1) : '--'}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide leading-tight">
                    Promedio
                  </div>
                </div>
              </Card>

              <Card className="p-3 border-2 border-border bg-card/80 backdrop-blur-sm">
                <div className="flex flex-col items-center text-center gap-1">
                  <div className="w-9 h-9 rounded-xl bg-[var(--probability-light)] flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-[var(--probability)]" />
                  </div>
                  <div className="text-xl font-black text-foreground leading-none">{stats.passed}</div>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide leading-tight">
                    Aprobadas
                  </div>
                </div>
              </Card>
            </div>

            {/* ── Filtros ─────────────────────────────── */}
            <section className="space-y-2">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
                Filtros
              </h2>
              <div className="flex flex-wrap gap-2">
                {(['all', 'algebra', 'analisis', 'probabilidad'] as SubjectFilter[]).map((s) => {
                  const Icon = s === 'all' ? BookOpen : subjectIcon[s]
                  const active = subjectFilter === s
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSubjectFilter(s)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all',
                        active
                          ? 'text-white border-transparent shadow-md'
                          : 'bg-card/80 border-border text-muted-foreground hover:border-primary/40'
                      )}
                      style={active ? { backgroundColor: s === 'all' ? 'var(--primary)' : subjectColorVar[s] } : {}}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {subjectLabel[s]}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2">
                {(['all', 'teorico', 'practico'] as ModeFilter[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModeFilter(m)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all',
                      modeFilter === m
                        ? 'bg-primary text-primary-foreground border-transparent shadow-md'
                        : 'bg-card/80 border-border text-muted-foreground hover:border-primary/40'
                    )}
                  >
                    {m === 'all' ? 'Todos los modos' : m === 'teorico' ? 'Teórico' : 'Práctico'}
                  </button>
                ))}
              </div>
            </section>

            {/* ── Evaluaciones ────────────────────────── */}
            <section>
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Evaluaciones recientes
                {filteredAttempts.length !== attempts.length && (
                  <span className="text-primary">({filteredAttempts.length})</span>
                )}
              </h2>

              {filteredAttempts.length === 0 ? (
                <Card className="p-8 text-center border-2 bg-card/80 backdrop-blur-sm">
                  <p className="text-muted-foreground text-sm">
                    {attempts.length === 0
                      ? 'Aún no completaste ninguna evaluación.'
                      : 'Ninguna evaluación coincide con los filtros.'}
                  </p>
                  {attempts.length === 0 && (
                    <Link href="/">
                      <Button className="mt-4">Empezar a practicar</Button>
                    </Link>
                  )}
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredAttempts.map((attempt) => {
                    const subjectKey = getSubjectKey(attempt.subject)
                    const color = getSubjectColor(attempt.subject)
                    const light = getSubjectLight(attempt.subject)
                    const SubIcon = subjectIcon[subjectKey] ?? BookOpen
                    const passed = Number(attempt.score) >= 6
                    const isExpanded = expandedAttempt === attempt.id

                    return (
                      <Card
                        key={attempt.id}
                        className="border-2 overflow-hidden bg-card/80 backdrop-blur-sm"
                        style={{ borderColor: `${color}30` }}
                      >
                        {/* Card header row */}
                        <div
                          className="p-4 cursor-pointer select-none"
                          onClick={() => handleExpandAttempt(attempt.id)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            {/* Left: icon + info */}
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                style={{ backgroundColor: light }}
                              >
                                <SubIcon className="w-5 h-5" style={{ color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-foreground text-sm truncate">{attempt.subject}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span
                                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                                    style={{ backgroundColor: color }}
                                  >
                                    {attempt.mode === 'teorico' ? 'Teórico' : 'Práctico'}
                                  </span>
                                  <span
                                    className={cn(
                                      'px-2 py-0.5 rounded-full text-[10px] font-bold',
                                      passed
                                        ? 'bg-[var(--analysis-light)] text-[var(--analysis)]'
                                        : 'bg-orange-100 text-orange-600'
                                    )}
                                  >
                                    {passed ? 'Aprobado' : 'Desaprobado'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(attempt.completed_at)}
                                </div>
                              </div>
                            </div>
                            {/* Right: score + chevron */}
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-right">
                                <p className="text-2xl font-black leading-none" style={{ color }}>
                                  {Number(attempt.score).toFixed(1)}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {attempt.correct_answers}/{attempt.total_questions}
                                </p>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded answers */}
                        {isExpanded && (
                          <div className="border-t-2 border-border/60 p-4 bg-muted/20 space-y-3">
                            {loadingDetails === attempt.id ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                              </div>
                            ) : attemptDetails[attempt.id] ? (
                              attemptDetails[attempt.id].map((answer, i) => (
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
                                      <CheckCircle className="w-5 h-5 text-[var(--analysis)] shrink-0 mt-0.5" />
                                    ) : (
                                      <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1 space-y-2 min-w-0">
                                      <p className="text-sm font-medium">
                                        {i + 1}.{' '}
                                        <LaTeXRenderer content={answer.question_text} />
                                      </p>

                                      {!answer.is_correct && (
                                        <>
                                          <div className="text-xs space-y-1">
                                            <p className="text-destructive">
                                              Tu respuesta:{' '}
                                              {String.fromCharCode(65 + answer.selected_answer)}){' '}
                                              <LaTeXRenderer content={answer.options[answer.selected_answer]} />
                                            </p>
                                            <p className="text-[var(--analysis)]">
                                              Correcta:{' '}
                                              {String.fromCharCode(65 + answer.correct_answer)}){' '}
                                              <LaTeXRenderer content={answer.options[answer.correct_answer]} />
                                            </p>
                                          </div>

                                          {explanations[answer.id] ? (
                                            <Card className="p-3 border border-[var(--algebra)]/30 bg-[var(--algebra-light)]">
                                              <div className="flex items-start gap-2">
                                                <Lightbulb className="w-4 h-4 text-[var(--algebra)] shrink-0 mt-0.5" />
                                                <div className="text-xs text-foreground/80 whitespace-pre-wrap">
                                                  <LaTeXRenderer content={explanations[answer.id]} />
                                                </div>
                                              </div>
                                            </Card>
                                          ) : (
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
                              ))
                            ) : (
                              <p className="text-center text-muted-foreground text-sm">
                                No se pudieron cargar los detalles.
                              </p>
                            )}
                          </div>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
            </section>

            {/* ── Dominio de Temas ─────────────────────── */}
            {mastery.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Dominio por tema
                </h2>
                <div className="space-y-2">
                  {mastery.map((item) => {
                    const subjectKey = getSubjectKey(item.subject)
                    const color = subjectColorVar[subjectKey] ?? 'var(--algebra)'
                    const light = subjectLightVar[subjectKey] ?? 'var(--algebra-light)'
                    const Icon = subjectIcon[subjectKey] ?? BookOpen

                    return (
                      <Card
                        key={`${item.subject}-${item.topic_id}`}
                        className="p-3 border-2 bg-card/80 backdrop-blur-sm"
                        style={{ borderColor: `${color}30` }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: light }}
                          >
                            <Icon className="w-4 h-4" style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{item.topic_name}</p>
                            <p className="text-xs text-muted-foreground">{item.subject}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" style={{ color }} />
                              <span className="font-black text-base" style={{ color }}>
                                {Number(item.max_score).toFixed(1)}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {item.attempts_count} intento{item.attempts_count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
