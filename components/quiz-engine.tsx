'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { X, ChevronRight, Check, AlertCircle, Lightbulb } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { LaTeXRenderer } from './latex-renderer'
import { MathBackground } from './math-background'
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
      finishQuiz()
      setActiveView('results')
    } else {
      nextQuestion()
      setAnswerState({ selected: null, submitted: false, isCorrect: null })
    }
  }, [isLastQuestion, finishQuiz, nextQuestion, setActiveView])

  const handleExit = useCallback(() => {
    if (confirm('Seguro que quieres salir? Perderas tu progreso actual.')) {
      setActiveView('dashboard')
    }
  }, [setActiveView])

  if (!currentQuestion) {
    return null
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      <MathBackground />
      
      {/* Header with Progress */}
      <header className="sticky top-0 z-20 bg-card/95 backdrop-blur-xl border-b-2 border-border shadow-sm">
        <div className="px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExit}
            className="shrink-0 rounded-xl hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <Progress value={progress} className="h-3 bg-muted [&>div]:bg-gradient-to-r [&>div]:from-[var(--algebra)] [&>div]:to-[var(--analysis)]" />
          </div>
          <div className="shrink-0 bg-[var(--algebra-light)] text-[var(--algebra)] px-3 py-1 rounded-full text-sm font-bold">
            {currentIndex + 1}/{questions.length}
          </div>
        </div>
        <div className="px-4 pb-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {config?.mode === 'teorico' ? 'Modo Teorico' : 'Modo Practico'}
          </span>
        </div>
      </header>

      {/* Question Content */}
      <main className="flex-1 px-4 py-6 pb-32 overflow-y-auto">
        <div className="space-y-5">
          {/* Question */}
          <Card className="p-5 border-2 border-border bg-card/90 backdrop-blur-sm shadow-lg">
            <h2 className="text-lg font-semibold text-foreground leading-relaxed">
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
                    'w-full text-left p-4 rounded-2xl border-2 transition-all duration-200',
                    'touch-manipulation active:scale-[0.98] bg-card/80 backdrop-blur-sm',
                    !answerState.submitted && !isSelected && 'border-border hover:border-[var(--algebra)]/50 hover:shadow-md',
                    !answerState.submitted && isSelected && 'border-[var(--algebra)] bg-[var(--algebra-light)] shadow-lg shadow-[var(--algebra)]/20',
                    showCorrect && 'border-[var(--analysis)] bg-[var(--analysis-light)] shadow-lg shadow-[var(--analysis)]/20',
                    showIncorrect && 'border-destructive bg-destructive/10 shadow-lg shadow-destructive/20',
                    answerState.submitted && !showCorrect && !showIncorrect && 'border-border opacity-50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold transition-all border-2',
                      !answerState.submitted && !isSelected && 'bg-muted text-muted-foreground border-transparent',
                      !answerState.submitted && isSelected && 'bg-[var(--algebra)] text-white border-[var(--algebra)]',
                      showCorrect && 'bg-[var(--analysis)] text-white border-[var(--analysis)]',
                      showIncorrect && 'bg-destructive text-white border-destructive'
                    )}>
                      {answerState.submitted ? (
                        showCorrect ? <Check className="w-5 h-5" /> :
                        showIncorrect ? <X className="w-5 h-5" /> :
                        String.fromCharCode(65 + index)
                      ) : (
                        String.fromCharCode(65 + index)
                      )}
                    </div>
                    <span className="flex-1 pt-2 font-medium">
                      <LaTeXRenderer content={option} className="text-foreground" />
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Explanation (shown after incorrect answer) */}
          {showExplanation && currentQuestion.explanation && (
            <Card className="p-5 border-2 border-[var(--algebra)]/30 bg-[var(--algebra-light)]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--algebra)] flex items-center justify-center shrink-0">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-2">Explicacion</h3>
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
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/95 backdrop-blur-xl border-t-2 border-border">
        <div className="flex gap-3">
          {answerState.submitted && !answerState.isCorrect && currentQuestion.explanation && !showExplanation && (
            <Button
              variant="outline"
              onClick={() => setShowExplanation(true)}
              className="flex-1 h-14 rounded-2xl border-2 font-bold gap-2"
            >
              <AlertCircle className="w-5 h-5" />
              Explicar Error
            </Button>
          )}
          
          {!answerState.submitted ? (
            <Button
              onClick={handleSubmit}
              disabled={answerState.selected === null}
              className={cn(
                'flex-1 h-14 text-lg font-bold rounded-2xl shadow-lg transition-all',
                'bg-gradient-to-r from-[var(--algebra)] to-[var(--algebra)]/80',
                'hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
                'disabled:opacity-50 disabled:shadow-none disabled:scale-100'
              )}
            >
              Verificar
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className={cn(
                'flex-1 h-14 text-lg font-bold gap-2 rounded-2xl shadow-lg transition-all',
                'hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
                answerState.isCorrect 
                  ? 'bg-gradient-to-r from-[var(--analysis)] to-[var(--analysis)]/80 shadow-[var(--analysis)]/30' 
                  : 'bg-gradient-to-r from-[var(--algebra)] to-[var(--algebra)]/80'
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
