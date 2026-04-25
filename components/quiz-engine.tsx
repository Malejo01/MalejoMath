'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { X, ChevronRight, Check, AlertCircle } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { LaTeXRenderer } from './latex-renderer'
import { cn } from '@/lib/utils'

type AnswerState = {
  selected: number | null
  submitted: boolean
  isCorrect: boolean | null
}

export function QuizEngine() {
  const { currentQuiz, answerQuestion, nextQuestion, setActiveView, finishQuiz } = useAppStore()
  const [answerState, setAnswerState] = useState<AnswerState>({
    selected: null,
    submitted: false,
    isCorrect: null
  })
  const [showExplanation, setShowExplanation] = useState(false)
  const [quizResult, setQuizResult] = useState<ReturnType<typeof finishQuiz> | null>(null)

  const { questions, currentIndex, config } = currentQuiz
  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + (answerState.submitted ? 1 : 0)) / questions.length) * 100
  const isLastQuestion = currentIndex === questions.length - 1

  const handleSelectAnswer = useCallback((index: number) => {
    if (answerState.submitted) return
    setAnswerState(prev => ({ ...prev, selected: index }))
  }, [answerState.submitted])

  const handleSubmit = useCallback(() => {
    if (answerState.selected === null || !currentQuestion) return
    
    const isCorrect = answerState.selected === currentQuestion.correctAnswer
    setAnswerState(prev => ({ ...prev, submitted: true, isCorrect }))
    
    answerQuestion(
      currentQuestion.id,
      answerState.selected,
      isCorrect,
      currentQuestion.topic
    )
  }, [answerState.selected, currentQuestion, answerQuestion])

  const handleNext = useCallback(() => {
    setShowExplanation(false)
    
    if (isLastQuestion) {
      const result = finishQuiz()
      setQuizResult(result)
      setActiveView('results')
    } else {
      nextQuestion()
      setAnswerState({ selected: null, submitted: false, isCorrect: null })
    }
  }, [isLastQuestion, finishQuiz, nextQuestion, setActiveView])

  const handleExit = useCallback(() => {
    if (confirm('¿Seguro que quieres salir? Perderás tu progreso actual.')) {
      setActiveView('dashboard')
    }
  }, [setActiveView])

  if (!currentQuestion) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with Progress */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExit}
            className="shrink-0"
          >
            <X className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <Progress value={progress} className="h-2" />
          </div>
          <span className="text-sm font-medium text-muted-foreground shrink-0">
            {currentIndex + 1}/{questions.length}
          </span>
        </div>
        <div className="px-4 pb-3">
          <span className="text-xs text-muted-foreground">
            {config?.mode === 'teorico' ? 'Modo Teórico' : 'Modo Práctico'}
          </span>
        </div>
      </header>

      {/* Question Content */}
      <main className="flex-1 px-4 py-6 pb-32 overflow-y-auto">
        <div className="space-y-6">
          {/* Question */}
          <Card className="p-5">
            <h2 className="text-lg font-medium text-foreground leading-relaxed">
              <LaTeXRenderer content={currentQuestion.question} />
            </h2>
          </Card>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = answerState.selected === index
              const isCorrectAnswer = currentQuestion.correctAnswer === index
              const showCorrect = answerState.submitted && isCorrectAnswer
              const showIncorrect = answerState.submitted && isSelected && !isCorrectAnswer

              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={answerState.submitted}
                  className={cn(
                    'w-full text-left p-4 rounded-xl border-2 transition-all duration-200',
                    'touch-manipulation active:scale-[0.98]',
                    !answerState.submitted && !isSelected && 'border-border bg-card hover:border-muted-foreground/50',
                    !answerState.submitted && isSelected && 'border-primary bg-primary/5',
                    showCorrect && 'border-accent bg-accent/10',
                    showIncorrect && 'border-destructive bg-destructive/10',
                    answerState.submitted && !showCorrect && !showIncorrect && 'border-border bg-card opacity-50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold transition-colors',
                      !answerState.submitted && !isSelected && 'bg-muted text-muted-foreground',
                      !answerState.submitted && isSelected && 'bg-primary text-primary-foreground',
                      showCorrect && 'bg-accent text-accent-foreground',
                      showIncorrect && 'bg-destructive text-destructive-foreground'
                    )}>
                      {answerState.submitted ? (
                        showCorrect ? <Check className="w-4 h-4" /> :
                        showIncorrect ? <X className="w-4 h-4" /> :
                        String.fromCharCode(65 + index)
                      ) : (
                        String.fromCharCode(65 + index)
                      )}
                    </div>
                    <span className="flex-1 pt-1">
                      <LaTeXRenderer content={option} className="text-foreground" />
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Explanation (shown after incorrect answer) */}
          {showExplanation && currentQuestion.explanation && (
            <Card className="p-5 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Explicación</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <LaTeXRenderer content={currentQuestion.explanation} />
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* Fixed Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="flex gap-3">
          {answerState.submitted && !answerState.isCorrect && currentQuestion.explanation && !showExplanation && (
            <Button
              variant="outline"
              onClick={() => setShowExplanation(true)}
              className="flex-1 h-14"
            >
              Explicar Error
            </Button>
          )}
          
          {!answerState.submitted ? (
            <Button
              onClick={handleSubmit}
              disabled={answerState.selected === null}
              className="flex-1 h-14 text-lg font-semibold"
            >
              Verificar
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className={cn(
                'flex-1 h-14 text-lg font-semibold gap-2',
                answerState.isCorrect ? 'bg-accent hover:bg-accent/90' : ''
              )}
            >
              {isLastQuestion ? 'Ver Resultados' : 'Siguiente'}
              <ChevronRight className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
