'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BookOpen, Calculator, ChevronDown, ChevronUp, Sparkles, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Subject } from '@/lib/types'
import { useAppStore } from '@/lib/store'

interface SubjectContentProps {
  subject: Subject
}

const colorConfig = {
  algebra: {
    bg: 'bg-[var(--algebra)]',
    bgLight: 'bg-[var(--algebra-light)]',
    text: 'text-[var(--algebra)]',
    border: 'border-[var(--algebra)]',
    borderLight: 'border-[var(--algebra)]/30',
    gradient: 'from-[var(--algebra)] to-[var(--algebra)]/80',
    shadow: 'shadow-[var(--algebra)]/20',
    progress: '[&>div]:bg-[var(--algebra)]',
  },
  analisis: {
    bg: 'bg-[var(--analysis)]',
    bgLight: 'bg-[var(--analysis-light)]',
    text: 'text-[var(--analysis)]',
    border: 'border-[var(--analysis)]',
    borderLight: 'border-[var(--analysis)]/30',
    gradient: 'from-[var(--analysis)] to-[var(--analysis)]/80',
    shadow: 'shadow-[var(--analysis)]/20',
    progress: '[&>div]:bg-[var(--analysis)]',
  },
  probabilidad: {
    bg: 'bg-[var(--probability)]',
    bgLight: 'bg-[var(--probability-light)]',
    text: 'text-[var(--probability)]',
    border: 'border-[var(--probability)]',
    borderLight: 'border-[var(--probability)]/30',
    gradient: 'from-[var(--probability)] to-[var(--probability)]/80',
    shadow: 'shadow-[var(--probability)]/20',
    progress: '[&>div]:bg-[var(--probability)]',
  }
}

export function SubjectContent({ subject }: SubjectContentProps) {
  const { selectedTopics, toggleTopic, setActiveView, startQuiz, getUsedQuestionIds } = useAppStore()
  const [expandedUnits, setExpandedUnits] = useState<string[]>([subject.units[0]?.id || ''])
  const [isLoading, setIsLoading] = useState(false)
  
  const colors = colorConfig[subject.id as keyof typeof colorConfig] || colorConfig.algebra

  const totalTopics = subject.units.reduce((acc, unit) => acc + unit.topics.length, 0)
  const completedTopics = subject.units.reduce(
    (acc, unit) => acc + unit.topics.filter(t => t.completed).length, 
    0
  )
  const progressPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0

  const toggleUnit = (unitId: string) => {
    setExpandedUnits(prev =>
      prev.includes(unitId)
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    )
  }

  const handleSelectAll = () => {
    const allTopics = subject.units.flatMap(u => u.topics.map(t => ({ id: t.id, name: t.name })))
    if (selectedTopics.length === allTopics.length) {
      allTopics.forEach(t => toggleTopic(t.id, t.name))
    } else {
      allTopics.forEach(t => {
        if (!selectedTopics.find(st => st.id === t.id)) {
          toggleTopic(t.id, t.name)
        }
      })
    }
  }

  const handleStartQuiz = async (mode: 'teorico' | 'practico') => {
    if (selectedTopics.length === 0) return
    
    console.log('[v0] Starting quiz with mode:', mode, 'topics:', selectedTopics)
    setIsLoading(true)
    setActiveView('loading')
    
    try {
      console.log('[v0] Fetching questions from API...')
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.name,
          topics: selectedTopics,
          mode,
          previousQuestionIds: getUsedQuestionIds()
        })
      })
      
      console.log('[v0] API response status:', response.status)
      const data = await response.json()
      console.log('[v0] API response data:', data)
      
      if (data.questions && data.questions.length > 0) {
        console.log('[v0] Questions received, starting quiz with', data.questions.length, 'questions')
        startQuiz(
          {
            subject: subject.id,
            subjectName: subject.name,
            topics: selectedTopics,
            mode,
            questionCount: mode === 'teorico' ? 20 : 10
          },
          data.questions
        )
      } else {
        console.log('[v0] No questions received, returning to dashboard')
        setActiveView('dashboard')
      }
    } catch (error) {
      console.log('[v0] Error fetching questions:', error)
      setActiveView('dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const allTopicsCount = subject.units.reduce((acc, u) => acc + u.topics.length, 0)
  const allSelected = selectedTopics.length === allTopicsCount

  return (
    <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-300">
      {/* Subject Header Card */}
      <Card className={cn('overflow-hidden border-2', colors.borderLight)}>
        <div className={cn('bg-gradient-to-r p-4 text-white', colors.gradient)}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{subject.name}</h2>
              <p className="text-white/80 text-sm">{subject.units.length} unidades disponibles</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black">{Math.round(progressPercentage)}%</div>
              <div className="text-white/80 text-xs">completado</div>
            </div>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2.5 mt-3 bg-white/30 [&>div]:bg-white"
          />
        </div>
      </Card>

      {/* Select All Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Sparkles className={cn('w-4 h-4', colors.text)} />
          Selecciona temas ({selectedTopics.length})
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSelectAll}
          className={cn('text-xs font-bold', colors.text)}
        >
          {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
        </Button>
      </div>

      {/* Units Accordion */}
      <div className="space-y-3">
        {subject.units.map((unit) => {
          const isExpanded = expandedUnits.includes(unit.id)
          const unitTopicIds = unit.topics.map(t => t.id)
          const selectedInUnit = selectedTopics.filter(t => unitTopicIds.includes(t.id)).length

          return (
            <Card 
              key={unit.id} 
              className={cn(
                'overflow-hidden border-2 transition-all',
                selectedInUnit > 0 ? colors.borderLight : 'border-border'
              )}
            >
              <button
                onClick={() => toggleUnit(unit.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold',
                    selectedInUnit > 0 ? cn(colors.bg, 'text-white') : 'bg-muted text-muted-foreground'
                  )}>
                    {selectedInUnit > 0 ? selectedInUnit : unit.topics.length}
                  </div>
                  <span className="font-semibold text-foreground text-left text-sm">
                    {unit.name}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
              
              {isExpanded && (
                <div className="border-t border-border px-2 py-2 bg-muted/30">
                  {unit.topics.map((topic) => {
                    const isSelected = selectedTopics.some(t => t.id === topic.id)
                    
                    return (
                      <button
                        key={topic.id}
                        onClick={() => toggleTopic(topic.id, topic.name)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all',
                          'hover:bg-white active:scale-[0.98]',
                          isSelected && 'bg-[var(--analysis-light)] border-2 border-foreground'
                        )}
                      >
                        <div className={cn(
                          'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all',
                          isSelected 
                            ? 'bg-foreground border-foreground' 
                            : 'border-muted-foreground/50 bg-white'
                        )}>
                          {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                        </div>
                        <span className={cn(
                          'flex-1 font-medium text-sm text-left',
                          isSelected ? 'text-foreground' : 'text-muted-foreground'
                        )}>
                          {topic.name}
                        </span>
                        {topic.completed && (
                          <span className="text-xs bg-[var(--analysis)] text-white px-2 py-0.5 rounded-full font-semibold">
                            Hecho
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Start Quiz Buttons */}
      {selectedTopics.length > 0 && (
        <div className="sticky bottom-4 pt-2 space-y-3">
          <Button
            onClick={() => handleStartQuiz('teorico')}
            disabled={isLoading}
            className={cn(
              'w-full h-14 text-lg font-bold gap-3 rounded-2xl shadow-xl transition-all',
              'bg-gradient-to-r from-[var(--algebra)] to-[var(--algebra)]/80 text-white border-0',
              'shadow-[var(--algebra)]/20',
              'disabled:opacity-50 disabled:shadow-none',
              'hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
            )}
            size="lg"
          >
            <BookOpen className="w-5 h-5" />
            Empezar Cuestionario Teorico
          </Button>
          
          <Button
            onClick={() => handleStartQuiz('practico')}
            disabled={isLoading}
            className={cn(
              'w-full h-14 text-lg font-bold gap-3 rounded-2xl shadow-xl transition-all',
              'bg-gradient-to-r from-[var(--analysis)] to-[var(--analysis)]/80 text-white border-0',
              'shadow-[var(--analysis)]/20',
              'disabled:opacity-50 disabled:shadow-none',
              'hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
            )}
            size="lg"
          >
            <Calculator className="w-5 h-5" />
            Empezar Cuestionario Practico
          </Button>
        </div>
      )}
    </div>
  )
}
