'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'
import { StreakBadge } from './streak-badge'
import { MathBackground } from './math-background'
import { LaTeXRenderer } from './latex-renderer'
import { Home, RotateCcw, TrendingUp, TrendingDown, Sparkles, Trophy, XCircle, CheckCircle, ChevronDown, ChevronUp, AlertCircle, Loader2, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'
import type { Answer } from '@/lib/types'
import { QuizModeDialog } from './quiz-mode-dialog'
import { useAuth } from '@clerk/nextjs'

export function ResultsScreen() {
  const { currentQuiz, userProgress, resetQuiz, setActiveView, startQuiz } = useAppStore()
  const { answers, questions, config } = currentQuiz
  const [showCorrect, setShowCorrect] = useState(false)
  const [showIncorrect, setShowIncorrect] = useState(false)
  const [loadingExplanation, setLoadingExplanation] = useState<string | null>(null)
  const [explanations, setExplanations] = useState<Record<string, string>>({})
  const [isRetrying, setIsRetrying] = useState(false)
  const [showRetryModal, setShowRetryModal] = useState(false)
  const { isSignedIn } = useAuth()
  const hasSavedRef = useRef(false)

  const results = useMemo(() => {
    const correctAnswers = answers.filter(a => a.isCorrect)
    const incorrectAnswers = answers.filter(a => !a.isCorrect)
    const correct = correctAnswers.length
    const total = questions.length
    const score = Number(((correct / total) * 10).toFixed(2))
    const percentage = (correct / total) * 100
    const passed = score >= 6

    return { correct, total, score, percentage, passed, correctAnswers, incorrectAnswers }
  }, [answers, questions])

  // Save quiz result to database
  useEffect(() => {
    if (!isSignedIn || hasSavedRef.current || !config || answers.length === 0) return
    
    hasSavedRef.current = true
    
    const saveResult = async () => {
      try {
        await fetch('/api/quiz/save-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: config.subjectName,
            mode: config.mode,
            topics: config.topics,
            totalQuestions: questions.length,
            correctAnswers: results.correct,
            score: results.score,
            answers: answers.map(a => ({
              questionId: a.questionId,
              questionText: a.questionText,
              options: a.options,
              selectedAnswer: a.selectedAnswer,
              correctAnswer: a.correctAnswer,
              isCorrect: a.isCorrect,
              explanation: a.explanation || '',
              topicName: a.topicName || ''
            }))
          })
        })
      } catch (error) {
        console.error('Error saving quiz result:', error)
      }
    }
    
    saveResult()
  }, [isSignedIn, config, answers, questions.length, results.correct, results.score])

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

  const handleExplainError = useCallback(async (answer: Answer) => {
    if (explanations[answer.questionId]) return
    
    setLoadingExplanation(answer.questionId)
    
    try {
      const response = await fetch('/api/explain-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: answer.questionText,
          selectedAnswer: answer.selectedAnswer,
          correctAnswer: answer.correctAnswer,
          options: answer.options,
          topic: answer.topicName,
          subject: config?.subjectName,
          pedagogyContext: config?.pedagogyContext,
        })
      })
      
      const data = await response.json()
      setExplanations(prev => ({ ...prev, [answer.questionId]: data.explanation }))
    } catch {
      setExplanations(prev => ({ ...prev, [answer.questionId]: 'No se pudo cargar la explicacion.' }))
    } finally {
      setLoadingExplanation(null)
    }
  }, [explanations])

  const handleRetry = useCallback(async (mode: 'teorico' | 'practico' | 'mixto') => {
    if (!config) return
    
    setIsRetrying(true)
    setShowRetryModal(false)
    setActiveView('loading')
    
    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: config.subjectName,
          topics: config.topics,
          mode,
          questionCount: config.questionCount,
          previousQuestions: questions.map((question) => ({
            id: question.id,
            question: question.question,
            topic: question.topic,
            topicName: question.topicName
          }))
        })
      })
      
      const data = await response.json()
      
      if (data.questions && data.questions.length === config.questionCount) {
        startQuiz({ ...config, mode }, data.questions)
      } else {
        setActiveView('results')
      }
    } catch {
      setActiveView('results')
    } finally {
      setIsRetrying(false)
    }
  }, [config, questions, setActiveView, startQuiz])

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
          {results.passed ? <Trophy className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          <span className="font-bold text-sm">
            {results.passed ? 'Aprobado' : 'A seguir practicando'}
          </span>
        </div>
        <h1 className="text-2xl font-black text-foreground">
          {results.passed ? 'Excelente trabajo!' : 'Sigue practicando!'}
        </h1>
        <p className="text-muted-foreground mt-1 font-medium">
          {config?.mode === 'teorico' ? 'Cuestionario Teorico' : config?.mode === 'practico' ? 'Cuestionario Practico' : 'Cuestionario Mixto'}
        </p>
      </header>

      {/* Main Content */}
      <main className="px-4 pb-[calc(9rem+env(safe-area-inset-bottom))] space-y-5 relative z-10">
        {/* Score Card */}
        <Card className={cn(
          'p-6 text-center border-2 overflow-hidden relative',
          results.passed 
            ? 'border-[var(--analysis)]/30 bg-gradient-to-br from-[var(--analysis-light)] to-white' 
            : 'border-orange-200 bg-gradient-to-br from-orange-50 to-white'
        )}>
          {results.passed && (
            <>
              <Sparkles className="absolute top-4 left-4 w-6 h-6 text-[var(--analysis)]/40" />
              <Sparkles className="absolute top-8 right-6 w-4 h-4 text-[var(--analysis)]/30" />
            </>
          )}
          
          <div className="relative">
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
          <Card 
            className={cn(
              'p-4 border-2 cursor-pointer transition-all',
              showCorrect 
                ? 'border-[var(--analysis)] bg-[var(--analysis-light)] shadow-lg' 
                : 'border-[var(--analysis)]/30 bg-[var(--analysis-light)]/50 hover:bg-[var(--analysis-light)]'
            )}
            onClick={() => { setShowCorrect(!showCorrect); setShowIncorrect(false) }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--analysis)] flex items-center justify-center mb-2">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-black text-[var(--analysis)]">{results.correct}</span>
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wide mt-1">Correctas</span>
              <div className="flex items-center gap-1 mt-2 text-[var(--analysis)]">
                <span className="text-xs font-semibold">Ver</span>
                {showCorrect ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </Card>
          <Card 
            className={cn(
              'p-4 border-2 cursor-pointer transition-all',
              showIncorrect 
                ? 'border-destructive bg-destructive/10 shadow-lg' 
                : 'border-destructive/30 bg-destructive/5 hover:bg-destructive/10'
            )}
            onClick={() => { setShowIncorrect(!showIncorrect); setShowCorrect(false) }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-destructive flex items-center justify-center mb-2">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-black text-destructive">{results.total - results.correct}</span>
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wide mt-1">Incorrectas</span>
              <div className="flex items-center gap-1 mt-2 text-destructive">
                <span className="text-xs font-semibold">Ver</span>
                {showIncorrect ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </Card>
        </div>

        {/* Correct Answers List */}
        {showCorrect && results.correctAnswers.length > 0 && (
          <div className="space-y-3 animate-in fade-in-50 slide-in-from-top-4">
            <h3 className="font-bold text-foreground flex items-center gap-2 px-1">
              <CheckCircle className="w-5 h-5 text-[var(--analysis)]" />
              Respuestas Correctas
            </h3>
            {results.correctAnswers.map((answer, i) => (
              <Card key={answer.questionId} className="p-4 border-2 border-[var(--analysis)]/30 bg-[var(--analysis-light)]">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[var(--analysis)] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        <LaTeXRenderer content={answer.questionText} />
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tema: {answer.topicName}
                      </p>
                    </div>
                  </div>
                  <div className="ml-8 p-2 bg-white rounded-lg border border-[var(--analysis)]/20">
                    <p className="text-sm text-[var(--analysis)] font-semibold">
                      {String.fromCharCode(65 + answer.correctAnswer)}) <LaTeXRenderer content={answer.options[answer.correctAnswer]} />
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Incorrect Answers List */}
        {showIncorrect && results.incorrectAnswers.length > 0 && (
          <div className="space-y-3 animate-in fade-in-50 slide-in-from-top-4">
            <h3 className="font-bold text-foreground flex items-center gap-2 px-1">
              <XCircle className="w-5 h-5 text-destructive" />
              Respuestas Incorrectas
            </h3>
            {results.incorrectAnswers.map((answer, i) => (
              <Card key={answer.questionId} className="p-4 border-2 border-destructive/30 bg-destructive/5">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-lg bg-destructive text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        <LaTeXRenderer content={answer.questionText} />
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tema: {answer.topicName}
                      </p>
                    </div>
                  </div>
                  
                  <div className="ml-8 space-y-2">
                    <div className="p-2 bg-destructive/10 rounded-lg border border-destructive/20">
                      <p className="text-sm text-destructive font-semibold">
                        Tu respuesta: {String.fromCharCode(65 + answer.selectedAnswer)}) <LaTeXRenderer content={answer.options[answer.selectedAnswer]} />
                      </p>
                    </div>
                    <div className="p-2 bg-[var(--analysis-light)] rounded-lg border border-[var(--analysis)]/20">
                      <p className="text-sm text-[var(--analysis)] font-semibold">
                        Correcta: {String.fromCharCode(65 + answer.correctAnswer)}) <LaTeXRenderer content={answer.options[answer.correctAnswer]} />
                      </p>
                    </div>
                  </div>

                  {/* Explanation */}
                  {explanations[answer.questionId] && (
                    <Card className="ml-8 p-4 border-2 border-[var(--algebra)]/30 bg-[var(--algebra-light)]">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-5 h-5 text-[var(--algebra)] shrink-0 mt-0.5" />
                        <div className="text-sm text-foreground/80 whitespace-pre-wrap">
                          <LaTeXRenderer content={explanations[answer.questionId]} />
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Explain Error Button */}
                  {!explanations[answer.questionId] && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExplainError(answer)}
                      disabled={loadingExplanation === answer.questionId}
                      className="ml-8 gap-2 border-2"
                    >
                      {loadingExplanation === answer.questionId ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Cargando...
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          Explicar Error
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Fixed Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t-2 border-border bg-card px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-12px_30px_rgba(15,23,42,0.12)]">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowRetryModal(true)}
            disabled={isRetrying}
            className="flex-1 h-14 gap-2 rounded-2xl border-2 font-bold"
          >
            {isRetrying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <RotateCcw className="w-5 h-5" />
                Reintentar
              </>
            )}
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
            Continuar
          </Button>
        </div>
      </div>

      <QuizModeDialog
        open={showRetryModal}
        onOpenChange={setShowRetryModal}
        onSelectMode={handleRetry}
        isLoading={isRetrying}
        title="Reintentar cuestionario"
        description="Selecciona si quieres regenerar este cuestionario en modo teorico, practico o mixto con los mismos temas."
        showQuestionCountSelector={false}
      />
    </div>
  )
}
