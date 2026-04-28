'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X, ChevronRight, Zap, Loader2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { WeakPoint } from '@/lib/types'
import { subjects } from '@/lib/data'
import { cn } from '@/lib/utils'
import { QuizModeDialog } from './quiz-mode-dialog'

interface WeakPointsSectionProps {
  weakPoints: WeakPoint[]
}

export function WeakPointsSection({ weakPoints }: WeakPointsSectionProps) {
  const { removeWeakPoint, setActiveView, startQuiz, getUsedQuestionIds } = useAppStore()
  const [loadingSubjectId, setLoadingSubjectId] = useState<string | null>(null)
  const [practiceModalSubjectId, setPracticeModalSubjectId] = useState<string | null>(null)

  const getTopicName = (topicId: string): string => {
    for (const subject of subjects) {
      for (const unit of subject.units) {
        const topic = unit.topics.find(t => t.id === topicId)
        if (topic) return topic.name
      }
    }
    return topicId
  }

  const getSubjectName = (subjectId: string): string => {
    const subject = subjects.find(s => s.id === subjectId)
    return subject?.name || subjectId
  }

  const handlePractice = async (subjectId: string, points: WeakPoint[], mode: 'teorico' | 'practico') => {
    const subject = subjects.find((item) => item.id === subjectId)
    if (!subject || points.length === 0) return

    const topics = points.map((point) => ({
      id: point.topic,
      name: point.topicName || getTopicName(point.topic)
    }))

    setLoadingSubjectId(subjectId)
    setPracticeModalSubjectId(null)
    setActiveView('loading')

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.name,
          topics,
          mode,
          previousQuestionIds: getUsedQuestionIds()
        })
      })

      const data = await response.json()

      if (data.questions && data.questions.length === 10) {
        startQuiz(
          {
            subject: subject.id,
            subjectName: subject.name,
            topics,
            mode,
            questionCount: 10
          },
          data.questions
        )
      } else {
        setActiveView('dashboard')
      }
    } catch {
      setActiveView('dashboard')
    } finally {
      setLoadingSubjectId(null)
    }
  }

  // Group weak points by subject
  const groupedWeakPoints = weakPoints.reduce((acc, wp) => {
    if (!acc[wp.subject]) {
      acc[wp.subject] = []
    }
    acc[wp.subject].push(wp)
    return acc
  }, {} as Record<string, WeakPoint[]>)

  return (
    <section className="space-y-3 mt-6">
      <div className="flex items-center gap-2 px-1">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-bold text-foreground">Temas a Reforzar</h3>
      </div>

      <Card className="p-4 border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
        <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          Estos temas necesitan mas practica.
        </p>

        <div className="space-y-4">
          {Object.entries(groupedWeakPoints).map(([subjectId, points]) => (
            <div key={subjectId} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">
                  {getSubjectName(subjectId)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPracticeModalSubjectId(subjectId)}
                  disabled={loadingSubjectId === subjectId}
                  className="h-8 px-3 border-2 border-orange-300 bg-white hover:bg-orange-50 text-orange-600 font-bold"
                >
                  {loadingSubjectId === subjectId ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      Practicar
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>

              <QuizModeDialog
                open={practiceModalSubjectId === subjectId}
                onOpenChange={(open) => setPracticeModalSubjectId(open ? subjectId : null)}
                onSelectMode={(mode) => handlePractice(subjectId, points, mode)}
                isLoading={loadingSubjectId === subjectId}
                title="Practicar temas a reforzar"
                description="Elige el tipo de examen para generar 10 preguntas sobre los temas que necesitas reforzar."
              />
              
              <div className="flex flex-wrap gap-2">
                {points.map((wp) => (
                  <div
                    key={wp.topic}
                    className={cn(
                      'flex items-center gap-2 bg-white rounded-xl px-3 py-2 text-sm',
                      'border-2 border-orange-200 shadow-sm'
                    )}
                  >
                    <span className="text-foreground font-medium">{getTopicName(wp.topic)}</span>
                    <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                      {wp.count}
                    </span>
                    <button
                      onClick={() => removeWeakPoint(wp.topic)}
                      className="text-muted-foreground hover:text-red-500 transition-colors ml-1"
                      aria-label={`Eliminar ${getTopicName(wp.topic)} de temas a reforzar`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  )
}
