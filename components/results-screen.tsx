'use client'

import { useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'
import { subjects } from '@/lib/data'
import { StreakBadge } from './streak-badge'
import { MathBackground } from './math-background'
import { Home, RotateCcw, Target, TrendingUp, TrendingDown, Sparkles, Trophy, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'

export function ResultsScreen() {
  const { currentQuiz, userProgress, resetQuiz, setSelectedSubject, setActiveView } = useAppStore()
  const { answers, questions, config } = currentQuiz

  const results = useMemo(() => {
    const correct = answers.filter(a => a.isCorrect).length
    const total = questions.length
    const score = Number(((correct / total) * 10).toFixed(2))
    const percentage = (correct / total) * 100
    const passed = score >= 6

    const incorrectTopics = [...new Set(
      answers.filter(a => !a.isCorrect).map(a => a.topic)
    )]

    return { correct, total, score, percentage, passed, incorrectTopics }
  }, [answers, questions])

  const getTopicName = (topicId: string): string => {
    for (const subject of subjects) {
      for (const unit of subject.units) {
        const topic = unit.topics.find(t => t.id === topicId)
        if (topic) return topic.name
      }
    }
    return topicId
  }

  // Trigger confetti on passing
  useEffect(() => {
    if (results.passed) {
      const duration = 3000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#6366f1', '#22c55e', '#f59e0b']
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#6366f1', '#22c55e', '#f59e0b']
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }
      frame()
    }
  }, [results.passed])

  const handleRetry = () => {
    if (config) {
      setSelectedSubject(config.subject)
      setActiveView('selector')
    }
  }

  const handleGoHome = () => {
    resetQuiz()
  }

  return (
    <div className="min-h-screen relative">
      <MathBackground />
      
      {/* Header */}
      <header className="px-4 py-8 text-center relative z-10">
        <div className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4',
          results.passed 
            ? 'bg-[var(--analysis-light)] text-[var(--analysis)]' 
            : 'bg-orange-100 text-orange-600'
        )}>
          {results.passed ? <Trophy className="w-5 h-5" /> : <Target className="w-5 h-5" />}
          <span className="font-bold text-sm">
            {results.passed ? 'Aprobado' : 'A seguir practicando'}
          </span>
        </div>
        <h1 className="text-2xl font-black text-foreground">
          {results.passed ? 'Excelente trabajo!' : 'Sigue practicando!'}
        </h1>
        <p className="text-muted-foreground mt-1 font-medium">
          {config?.mode === 'teorico' ? 'Cuestionario Teorico' : 'Cuestionario Practico'}
        </p>
      </header>

      {/* Main Content */}
      <main className="px-4 pb-32 space-y-5 relative z-10">
        {/* Score Card */}
        <Card className={cn(
          'p-6 text-center border-2 overflow-hidden relative',
          results.passed 
            ? 'border-[var(--analysis)]/30 bg-gradient-to-br from-[var(--analysis-light)] to-white' 
            : 'border-orange-200 bg-gradient-to-br from-orange-50 to-white'
        )}>
          {/* Decorative sparkles */}
          {results.passed && (
            <>
              <Sparkles className="absolute top-4 left-4 w-6 h-6 text-[var(--analysis)]/40" />
              <Sparkles className="absolute top-8 right-6 w-4 h-4 text-[var(--analysis)]/30" />
            </>
          )}
          
          <div className="relative">
            {/* Score Circle */}
            <div className={cn(
              'w-36 h-36 mx-auto rounded-3xl flex items-center justify-center',
              'border-4 shadow-xl',
              results.passed 
                ? 'border-[var(--analysis)] bg-white shadow-[var(--analysis)]/30' 
                : 'border-orange-400 bg-white shadow-orange-400/30'
            )}>
              <div>
                <span className={cn(
                  'text-5xl font-black',
                  results.passed ? 'text-[var(--analysis)]' : 'text-orange-500'
                )}>
                  {results.score.toFixed(2)}
                </span>
                <span className="text-lg text-muted-foreground font-bold">/10</span>
              </div>
            </div>

            {/* Trend Badge */}
            <div className={cn(
              'absolute -top-2 right-1/4 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg',
              results.passed 
                ? 'bg-gradient-to-br from-[var(--analysis)] to-emerald-400 shadow-[var(--analysis)]/40' 
                : 'bg-gradient-to-br from-orange-400 to-red-400 shadow-orange-400/40'
            )}>
              {results.passed ? (
                <TrendingUp className="w-6 h-6 text-white" />
              ) : (
                <TrendingDown className="w-6 h-6 text-white" />
              )}
            </div>
          </div>

          <div className="mt-5 space-y-1">
            <p className="text-xl font-bold text-foreground">
              {results.correct} de {results.total} correctas
            </p>
            <p className="text-sm text-muted-foreground font-medium">
              {Math.round(results.percentage)}% de aciertos
            </p>
          </div>
        </Card>

        {/* Streak Card */}
        <Card className="p-5 border-2 border-border bg-card/90 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-foreground">Tu Racha</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {userProgress.streak >= 2 
                  ? 'Racha activa - sigue asi!' 
                  : userProgress.streak === 1
                    ? 'Una mas para activar la racha'
                    : 'Aprueba 2 seguidos para activar'}
              </p>
            </div>
            <StreakBadge streak={userProgress.streak} size="lg" />
          </div>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 border-2 border-[var(--analysis)]/30 bg-[var(--analysis-light)]">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--analysis)] flex items-center justify-center mb-2">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-black text-[var(--analysis)]">{results.correct}</span>
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wide mt-1">Correctas</span>
            </div>
          </Card>
          <Card className="p-4 border-2 border-destructive/30 bg-destructive/5">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-destructive flex items-center justify-center mb-2">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-black text-destructive">{results.total - results.correct}</span>
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wide mt-1">Incorrectas</span>
            </div>
          </Card>
        </div>

        {/* Incorrect Topics */}
        {results.incorrectTopics.length > 0 && (
          <Card className="p-5 border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-foreground">Temas para repasar</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {results.incorrectTopics.map((topic) => (
                <span
                  key={topic}
                  className="px-3 py-2 bg-white border-2 border-orange-200 text-foreground rounded-xl text-sm font-semibold shadow-sm"
                >
                  {getTopicName(topic)}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 font-medium">
              Estos temas se han agregado a tu seccion de refuerzo
            </p>
          </Card>
        )}
      </main>

      {/* Fixed Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/95 backdrop-blur-xl border-t-2 border-border">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleRetry}
            className="flex-1 h-14 gap-2 rounded-2xl border-2 font-bold"
          >
            <RotateCcw className="w-5 h-5" />
            Reintentar
          </Button>
          <Button
            onClick={handleGoHome}
            className={cn(
              'flex-1 h-14 gap-2 rounded-2xl font-bold shadow-lg',
              'bg-gradient-to-r from-[var(--algebra)] to-[var(--analysis)]',
              'hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all'
            )}
          >
            <Home className="w-5 h-5" />
            Inicio
          </Button>
        </div>
      </div>
    </div>
  )
}
