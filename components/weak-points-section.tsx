'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { WeakPoint } from '@/lib/types'
import { subjects } from '@/lib/data'

interface WeakPointsSectionProps {
  weakPoints: WeakPoint[]
}

export function WeakPointsSection({ weakPoints }: WeakPointsSectionProps) {
  const { removeWeakPoint, setSelectedSubject, setActiveView } = useAppStore()

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

  const handlePractice = (subjectId: string) => {
    setSelectedSubject(subjectId)
    setActiveView('selector')
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
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-destructive" />
        <h3 className="font-semibold text-foreground">Temas a Reforzar</h3>
      </div>

      <Card className="p-4 border-destructive/20 bg-destructive/5">
        <p className="text-sm text-muted-foreground mb-4">
          Estos temas necesitan más práctica basado en tus errores recientes.
        </p>

        <div className="space-y-4">
          {Object.entries(groupedWeakPoints).map(([subjectId, points]) => (
            <div key={subjectId} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {getSubjectName(subjectId)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePractice(subjectId)}
                  className="text-primary h-8 px-2"
                >
                  Practicar
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {points.map((wp) => (
                  <div
                    key={wp.topic}
                    className="flex items-center gap-2 bg-background rounded-full px-3 py-1.5 text-sm border border-border"
                  >
                    <span className="text-foreground">{getTopicName(wp.topic)}</span>
                    <span className="text-xs text-destructive font-medium">
                      x{wp.count}
                    </span>
                    <button
                      onClick={() => removeWeakPoint(wp.topic)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={`Eliminar ${getTopicName(wp.topic)} de temas a reforzar`}
                    >
                      <X className="w-3.5 h-3.5" />
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
