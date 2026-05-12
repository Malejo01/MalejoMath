'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { X, ChevronRight, ChevronLeft, Check, AlertCircle, Lightbulb, Loader2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { LaTeXRenderer } from './latex-renderer'
import { MathBackground } from './math-background'
import { cn } from '@/lib/utils'
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

type AnswerState = {
  selected: number | null
  submitted: boolean
  isCorrect: boolean | null
}

export function QuizEngine() {
  const { currentQuiz, answerQuestion, nextQuestion, previousQuestion, setActiveView, finishQuiz, updateQuestions } = useAppStore()
  const [answerState, setAnswerState] = useState<AnswerState>({
    selected: null,
    submitted: false,
    isCorrect: null
  })
  const [detailedExplanation, setDetailedExplanation] = useState<string | null>(null)
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false)
  const [isEditingQuestion, setIsEditingQuestion] = useState(false)
  const [questionDraft, setQuestionDraft] = useState('')
  const [optionsDraft, setOptionsDraft] = useState<string[]>([])
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<'exit' | 'next' | 'prev' | 'cancel-edit' | null>(null)

  const { questions, currentIndex, config } = currentQuiz
  const currentQuestion = questions[currentIndex]
  const isPreviewMode = Boolean(config?.previewOnly)
  const progress = isPreviewMode
    ? ((currentIndex + 1) / questions.length) * 100
    : ((currentIndex + (answerState.submitted ? 1 : 0)) / questions.length) * 100
  const isLastQuestion = currentIndex === questions.length - 1
  const isFirstQuestion = currentIndex === 0

  const hasUnsavedPreviewChanges =
    isPreviewMode &&
    isEditingQuestion &&
    currentQuestion &&
    (questionDraft !== currentQuestion.question ||
      optionsDraft.length !== currentQuestion.options.length ||
      optionsDraft.some((option, index) => option !== currentQuestion.options[index]))

  const requestOrRunAction = useCallback((action: 'exit' | 'next' | 'prev' | 'cancel-edit', run: () => void) => {
    if (hasUnsavedPreviewChanges) {
      setPendingAction(action)
      setShowUnsavedDialog(true)
      return
    }

    run()
  }, [hasUnsavedPreviewChanges])

  const applyPendingAction = useCallback((action: 'exit' | 'next' | 'prev' | 'cancel-edit' | null) => {
    if (!action) return

    if (action === 'exit') {
      setIsEditingQuestion(false)
      setActiveView('dashboard')
      return
    }

    if (action === 'next') {
      setIsEditingQuestion(false)
      if (!isLastQuestion) {
        nextQuestion()
      }
      return
    }

    if (action === 'prev') {
      setIsEditingQuestion(false)
      if (!isFirstQuestion) {
        previousQuestion()
      }
      return
    }

    if (action === 'cancel-edit') {
      setIsEditingQuestion(false)
      return
    }
  }, [isFirstQuestion, isLastQuestion, nextQuestion, previousQuestion, setActiveView])

  const handleStartEditQuestion = useCallback(() => {
    if (!isPreviewMode || !currentQuestion) return
    setQuestionDraft(currentQuestion.question)
    setOptionsDraft([...currentQuestion.options])
    setIsEditingQuestion(true)
  }, [isPreviewMode, currentQuestion])

  const handleSaveEditedQuestion = useCallback(() => {
    if (!isPreviewMode || !currentQuestion) return

    const nextQuestions = questions.map((question, index) => (
      index === currentIndex
        ? { ...question, question: questionDraft, options: [...optionsDraft] }
        : question
    ))

    updateQuestions(nextQuestions)
    setIsEditingQuestion(false)
  }, [isPreviewMode, currentQuestion, questions, currentIndex, questionDraft, optionsDraft, updateQuestions])

  const handleCancelEditQuestion = useCallback(() => {
    requestOrRunAction('cancel-edit', () => setIsEditingQuestion(false))
  }, [requestOrRunAction])

  const handleSelectAnswer = useCallback((index: number) => {
    if (isPreviewMode) return
    if (answerState.submitted) return
    setAnswerState(prev => ({ ...prev, selected: index }))
  }, [answerState.submitted, isPreviewMode])

  const handleSubmit = useCallback(() => {
    if (isPreviewMode) return
    if (answerState.selected === null || !currentQuestion) return
    
    const isCorrect = answerState.selected === currentQuestion.correctAnswer
    setAnswerState(prev => ({ ...prev, submitted: true, isCorrect }))
    
    answerQuestion({
      questionId: currentQuestion.id,
      questionText: currentQuestion.question,
      options: currentQuestion.options,
      selectedAnswer: answerState.selected,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      topic: currentQuestion.topic,
      topicName: currentQuestion.topicName,
      explanation: currentQuestion.explanation
    })
  }, [answerState.selected, currentQuestion, answerQuestion, isPreviewMode])

  const handleNext = useCallback(() => {
    if (isPreviewMode) {
      requestOrRunAction('next', () => {
        setIsEditingQuestion(false)
        if (!isLastQuestion) {
          nextQuestion()
        }
      })
      return
    }

    setDetailedExplanation(null)
    
    if (isLastQuestion) {
      finishQuiz()
      setActiveView('results')
    } else {
      nextQuestion()
      setAnswerState({ selected: null, submitted: false, isCorrect: null })
    }
  }, [isPreviewMode, isLastQuestion, finishQuiz, nextQuestion, requestOrRunAction, setActiveView])

  const handlePrevious = useCallback(() => {
    if (!isPreviewMode || isFirstQuestion) return
    requestOrRunAction('prev', () => {
      setIsEditingQuestion(false)
      previousQuestion()
    })
  }, [isPreviewMode, isFirstQuestion, previousQuestion, requestOrRunAction])

  const handleExplainError = useCallback(async () => {
    if (!currentQuestion || answerState.selected === null) return
    
    setIsLoadingExplanation(true)
    
    try {
      const response = await fetch('/api/explain-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.question,
          selectedAnswer: answerState.selected,
          correctAnswer: currentQuestion.correctAnswer,
          options: currentQuestion.options,
          topic: currentQuestion.topicName,
          subject: config?.subjectName,
          pedagogyContext: config?.pedagogyContext,
        })
      })
      
      const data = await response.json()
      setDetailedExplanation(data.explanation)
    } catch {
      setDetailedExplanation('No se pudo cargar la explicacion. Intenta de nuevo.')
    } finally {
      setIsLoadingExplanation(false)
    }
  }, [currentQuestion, answerState.selected])

  const handleExit = useCallback(() => {
    if (isPreviewMode) {
      requestOrRunAction('exit', () => {
        setIsEditingQuestion(false)
        setActiveView('dashboard')
      })
      return
    }

    if (confirm('Seguro que quieres salir? Perderas tu progreso actual.')) {
      setActiveView('dashboard')
    }
  }, [isPreviewMode, requestOrRunAction, setActiveView])

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
            {isPreviewMode
              ? `Previsualizacion - ${currentQuestion.topicName}`
              : `${config?.mode === 'teorico' ? 'Modo Teorico' : 'Modo Practico'} - ${currentQuestion.topicName}`}
          </span>
        </div>
      </header>

      {/* Question Content */}
      <main className="flex-1 px-4 py-6 pb-36 overflow-y-auto">
        <div className="space-y-5">
          {/* Question */}
          <Card className="p-6 border-2 border-border bg-card/90 backdrop-blur-sm shadow-lg">
            <div className="space-y-4">
              {isPreviewMode && (
                <div className="flex flex-wrap gap-2">
                  {!isEditingQuestion ? (
                    <Button type="button" variant="outline" onClick={handleStartEditQuestion}>
                      Editar Pregunta
                    </Button>
                  ) : (
                    <>
                      <Button type="button" onClick={handleSaveEditedQuestion}>Guardar</Button>
                      <Button type="button" variant="outline" onClick={handleCancelEditQuestion}>Salir sin guardar</Button>
                    </>
                  )}
                </div>
              )}

              {!isPreviewMode || !isEditingQuestion ? (
                <h2 className="text-xl font-bold text-foreground leading-relaxed">
                  <LaTeXRenderer content={currentQuestion.question} />
                </h2>
              ) : (
                <textarea
                  className="w-full min-h-28 border rounded-lg p-3 bg-background text-sm"
                  value={questionDraft}
                  onChange={(event) => setQuestionDraft(event.target.value)}
                />
              )}
            </div>
          </Card>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = answerState.selected === index
              const isCorrectAnswer = currentQuestion.correctAnswer === index
              const showCorrect = answerState.submitted && isCorrectAnswer
              const showIncorrect = answerState.submitted && isSelected && !isCorrectAnswer

              const previewOptionValue = isEditingQuestion ? (optionsDraft[index] ?? option) : option

              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={answerState.submitted || (isPreviewMode && !isEditingQuestion)}
                  className={cn(
                    'w-full text-left p-4 rounded-2xl border-2 transition-all duration-200',
                    'touch-manipulation bg-card/80 backdrop-blur-sm',
                    showIncorrect && 'animate-shake',
                    isPreviewMode && !isEditingQuestion && 'border-border opacity-95 cursor-default',
                    !isPreviewMode && !answerState.submitted && !isSelected && 'border-border hover:border-[var(--algebra)]/50 hover:shadow-md active:scale-[0.98]',
                    !isPreviewMode && !answerState.submitted && isSelected && 'border-[var(--algebra)] bg-[var(--algebra-light)] shadow-lg shadow-[var(--algebra)]/20',
                    showCorrect && 'border-[var(--analysis)] bg-[var(--analysis-light)] shadow-lg shadow-[var(--analysis)]/20 border-4',
                    showIncorrect && 'border-destructive bg-destructive/10 shadow-lg shadow-destructive/20 border-4',
                    !isPreviewMode && answerState.submitted && !showCorrect && !showIncorrect && 'border-border opacity-40'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-lg font-bold transition-all border-2',
                      !answerState.submitted && !isSelected && 'bg-muted text-muted-foreground border-transparent',
                      !answerState.submitted && isSelected && 'bg-[var(--algebra)] text-white border-[var(--algebra)]',
                      showCorrect && 'bg-[var(--analysis)] text-white border-[var(--analysis)]',
                      showIncorrect && 'bg-destructive text-white border-destructive'
                    )}>
                      {answerState.submitted ? (
                        showCorrect ? <Check className="w-6 h-6" strokeWidth={3} /> :
                        showIncorrect ? <X className="w-6 h-6" strokeWidth={3} /> :
                        String.fromCharCode(65 + index)
                      ) : (
                        String.fromCharCode(65 + index)
                      )}
                    </div>
                    <span className="flex-1 pt-2.5 font-semibold text-base">
                      {!isPreviewMode || !isEditingQuestion ? (
                        <LaTeXRenderer content={previewOptionValue} className="text-foreground" />
                      ) : (
                        <input
                          value={previewOptionValue}
                          onChange={(event) => {
                            setOptionsDraft((prev) => {
                              const next = [...prev]
                              next[index] = event.target.value
                              return next
                            })
                          }}
                          className="w-full border rounded-md px-2 py-1 bg-background text-sm"
                        />
                      )}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Feedback after answer - correct */}
          {!isPreviewMode && answerState.submitted && answerState.isCorrect && (
            <Card className="p-5 border-2 border-[var(--analysis)] bg-[var(--analysis-light)] animate-in fade-in-50 slide-in-from-bottom-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--analysis)] flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-white" strokeWidth={3} />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--analysis)] mb-1">Correcto!</h3>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    <LaTeXRenderer content={currentQuestion.explanation} />
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Feedback after answer - incorrect */}
          {!isPreviewMode && answerState.submitted && !answerState.isCorrect && (
            <Card className="p-5 border-2 border-destructive bg-destructive/5 animate-in fade-in-50 slide-in-from-bottom-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive flex items-center justify-center shrink-0">
                  <X className="w-5 h-5 text-white" strokeWidth={3} />
                </div>
                <div>
                  <h3 className="font-bold text-destructive mb-1">Incorrecto</h3>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    La respuesta correcta era <strong>{String.fromCharCode(65 + currentQuestion.correctAnswer)}</strong>.{' '}
                    <LaTeXRenderer content={currentQuestion.explanation} />
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Detailed Explanation Modal */}
          {!isPreviewMode && detailedExplanation && (
            <Card className="p-5 border-2 border-[var(--algebra)]/30 bg-[var(--algebra-light)] animate-in fade-in-50 slide-in-from-bottom-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--algebra)] flex items-center justify-center shrink-0">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-2">Explicacion Detallada</h3>
                  <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    <LaTeXRenderer content={detailedExplanation} />
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* Fixed Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/95 backdrop-blur-xl border-t-2 border-border">
        <div className="flex gap-3">
          {isPreviewMode ? (
            <>
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstQuestion}
                className="flex-1 h-14 rounded-2xl border-2 font-bold gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Anterior
              </Button>
              <Button
                onClick={handleNext}
                disabled={isLastQuestion}
                className="flex-1 h-14 text-lg font-bold gap-2 rounded-2xl"
              >
                Siguiente
                <ChevronRight className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <>
          {answerState.submitted && !answerState.isCorrect && !detailedExplanation && (
            <Button
              variant="outline"
              onClick={handleExplainError}
              disabled={isLoadingExplanation}
              className="flex-1 h-14 rounded-2xl border-2 font-bold gap-2"
            >
              {isLoadingExplanation ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5" />
                  Explicar Error
                </>
              )}
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
            </>
          )}
        </div>
      </div>

      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambios sin guardar</AlertDialogTitle>
            <AlertDialogDescription>
              Los cambios de esta pregunta no fueron guardados. ¿Continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingAction(null)
                setShowUnsavedDialog(false)
              }}
            >
              No
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const action = pendingAction
                setPendingAction(null)
                setShowUnsavedDialog(false)
                applyPendingAction(action)
              }}
            >
              Si
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
