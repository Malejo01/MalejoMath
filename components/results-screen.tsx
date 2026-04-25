'use client'

import { useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'
import { subjects } from '@/lib/data'
import { StreakBadge } from './streak-badge'
import { Home, RotateCcw, Target, TrendingUp, TrendingDown } from 'lucide-react'
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
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 py-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          {results.passed ? '!Excelente trabajo!' : 'Sigue practicando'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {config?.mode === 'teorico' ? 'Cuestionario Teórico' : 'Cuestionario Práctico'}
        </p>
      </header>

      {/* Main Content */}
      <main className="px-4 pb-32 space-y-6">
        {/* Score Card */}
        <Card className={cn(
          'p-6 text-center border-2',
          results.passed 
            ? 'bg-accent/5 border-accent/30' 
            : 'bg-destructive/5 border-destructive/30'
        )}>
          <div className="relative">
            {/* Score Circle */}
            <div className={cn(
              'w-32 h-32 mx-auto rounded-full flex items-center justify-center',
              'border-4',
              results.passed ? 'border-accent bg-accent/10' : 'border-destructive bg-destructive/10'
            )}>
              <div>
                <span className={cn(
                  'text-4xl font-bold',
                  results.passed ? 'text-accent' : 'text-destructive'
                )}>
                  {results.score.toFixed(2)}
                </span>
                <span className="text-lg text-muted-foreground">/10</span>
              </div>
            </div>

            {/* Trend Icon */}
            <div className={cn(
              'absolute top-0 right-1/4 w-10 h-10 rounded-full flex items-center justify-center',
              results.passed ? 'bg-accent text-accent-foreground' : 'bg-destructive text-destructive-foreground'
            )}>
              {results.passed ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
            </div>
          </div>

          <div className="mt-4 space-y-1">
            <p className="text-lg font-semibold text-foreground">
              {results.correct} de {results.total} correctas
            </p>
            <p className="text-sm text-muted-foreground">
              {Math.round(results.percentage)}% de aciertos
            </p>
          </div>
        </Card>

        {/* Streak Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Tu Racha</h3>
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

        {/* Incorrect Topics */}
        {results.incorrectTopics.length > 0 && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-destructive" />
              <h3 className="font-semibold text-foreground">Temas para repasar</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {results.incorrectTopics.map((topic) => (
                <span
                  key={topic}
                  className="px-3 py-1.5 bg-destructive/10 text-destructive rounded-full text-sm font-medium"
                >
                  {getTopicName(topic)}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Estos temas se han agregado a tu seccion de refuerzo
            </p>
          </Card>
        )}

        {/* Stats Summary */}
        <Card className="p-5">
          <h3 className="font-semibold text-foreground mb-4">Resumen</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <span className="text-2xl font-bold text-accent">{results.correct}</span>
              <p className="text-xs text-muted-foreground mt-1">Correctas</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <span className="text-2xl font-bold text-destructive">{results.total - results.correct}</span>
              <p className="text-xs text-muted-foreground mt-1">Incorrectas</p>
            </div>
          </div>
        </Card>
      </main>

      {/* Fixed Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleRetry}
            className="flex-1 h-14 gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Reintentar
          </Button>
          <Button
            onClick={handleGoHome}
            className="flex-1 h-14 gap-2"
          >
            <Home className="w-5 h-5" />
            Inicio
          </Button>
        </div>
      </div>
    </div>
  )
}
