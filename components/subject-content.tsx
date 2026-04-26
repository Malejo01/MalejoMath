'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BookOpen, Calculator, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Subject, Topic } from '@/lib/types'
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
  },
  analisis: {
    bg: 'bg-[var(--analysis)]',
    bgLight: 'bg-[var(--analysis-light)]',
    text: 'text-[var(--analysis)]',
    border: 'border-[var(--analysis)]',
    borderLight: 'border-[var(--analysis)]/30',
    gradient: 'from-[var(--analysis)] to-[var(--analysis)]/80',
  },
  probabilidad: {
    bg: 'bg-[var(--probability)]',
    bgLight: 'bg-[var(--probability-light)]',
    text: 'text-[var(--probability)]',
    border: 'border-[var(--probability)]',
    borderLight: 'border-[var(--probability)]/30',
    gradient: 'from-[var(--probability)] to-[var(--probability)]/80',
  }
}

export function SubjectContent({ subject }: SubjectContentProps) {
  const { selectedTopics, toggleTopic, setActiveView, startQuiz, getUsedQuestionIds } = useAppStore()
  const [isLoading, setIsLoading] = useState(false)
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({})
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  
  const colors = colorConfig[subject.id as keyof typeof colorConfig] || colorConfig.algebra

  const totalTopics = subject.units.reduce((acc, unit) => acc + unit.topics.length, 0)
  const completedTopics = subject.units.reduce(
    (acc, unit) => acc + unit.topics.filter(t => t.completed).length, 
    0
  )
  const progressPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0

  const handleStartQuiz = async (mode: 'teorico' | 'practico') => {
    if (selectedTopics.length === 0) return
    
    setIsLoading(true)
    setActiveView('loading')
    
    try {
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
      
      const data = await response.json()
      
      if (data.questions && data.questions.length > 0) {
        startQuiz(
          {
            subject: subject.id,
            subjectName: subject.name,
            topics: selectedTopics,
            mode,
            questionCount: 10
          },
          data.questions
        )
      } else {
        console.error('No questions received:', data.error)
        setActiveView('dashboard')
      }
    } catch (error) {
      console.error('Quiz generation error:', error)
      setActiveView('dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedIds = new Set(selectedTopics.map(t => t.id))

  const toggleGroup = (topics: Topic[]) => {
    const allSelected = topics.every(t => selectedIds.has(t.id))
    topics.forEach((topic) => {
      const isSelected = selectedIds.has(topic.id)
      if (allSelected && isSelected) toggleTopic(topic.id, topic.name)
      if (!allSelected && !isSelected) toggleTopic(topic.id, topic.name)
    })
  }

  return (
    <div className="space-y-5 animate-in fade-in-50 slide-in-from-bottom-4 duration-300">
      {/* Subject Header Card */}
      <Card className={cn('overflow-hidden border-2', colors.borderLight)}>
        <div className={cn('bg-gradient-to-r p-4 text-white', colors.gradient)}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{subject.name}</h2>
              <p className="text-white/80 text-sm">{subject.units.length} unidades</p>
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

      {/* Selected count */}
      {selectedTopics.length > 0 && (
        <div className="text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold border-2 border-emerald-300">
            <Check className="w-4 h-4" />
            {selectedTopics.length} tema{selectedTopics.length !== 1 ? 's' : ''} seleccionado{selectedTopics.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Units List */}
      <div className="space-y-6">
        {subject.units.map((unit, unitIndex) => {
          const groupedTopics = unit.topics.reduce<{ group: string; topics: Topic[] }[]>((acc, topic) => {
            const groupName = topic.group ?? ''
            const lastGroup = acc[acc.length - 1]

            if (!lastGroup || lastGroup.group !== groupName) {
              acc.push({ group: groupName, topics: [topic] })
            } else {
              lastGroup.topics.push(topic)
            }

            return acc
          }, [])

          const isExpanded = expandedUnits[unit.id] ?? false

          const toggleUnitExpanded = () => {
            setExpandedUnits(prev => ({
              ...prev,
              [unit.id]: !isExpanded
            }))
          }

          return (
            <div key={unit.id} className="space-y-3">
              {/* Unit Header */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleGroup(unit.topics)}
                  className={cn(
                    'flex-1 flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors',
                    colors.bgLight,
                    'border-2',
                    colors.borderLight
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-lg',
                    colors.bg
                  )}>
                    {unitIndex + 1}
                  </div>
                  <h3 className="font-bold text-foreground text-base">
                    Unidad {unitIndex + 1}: {unit.name.replace(/^Unidad\s+[IVX]+:\s*/i, '')}
                  </h3>
                </button>
                <button
                  type="button"
                  onClick={toggleUnitExpanded}
                  className={cn(
                    'h-12 w-12 rounded-xl border-2 flex items-center justify-center transition-colors',
                    colors.bgLight,
                    colors.borderLight,
                    'hover:border-muted-foreground/50'
                  )}
                  aria-label={isExpanded ? 'Ocultar subtemas' : 'Mostrar subtemas'}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>

              {isExpanded && (
                <div className="space-y-3">
                  {groupedTopics.map((group) => {
                  const selectedCount = group.topics.filter(topic => selectedIds.has(topic.id)).length
                  const allSelected = selectedCount === group.topics.length
                  const someSelected = selectedCount > 0 && !allSelected
                    const groupKey = `${unit.id}:${group.group || group.topics[0].id}`
                    const isGroupExpanded = expandedGroups[groupKey] ?? true

                    const toggleGroupExpanded = () => {
                      setExpandedGroups(prev => ({
                        ...prev,
                        [groupKey]: !isGroupExpanded
                      }))
                    }

                  return (
                    <div key={group.group || group.topics[0].id} className="space-y-2">
                        {group.group && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleGroup(group.topics)}
                              className={cn(
                                'flex-1 flex items-center justify-between gap-2 px-3 py-2 rounded-xl border-2 text-xs font-bold',
                                allSelected && 'bg-emerald-400 border-foreground text-foreground',
                                someSelected && !allSelected && 'bg-emerald-100 border-emerald-400 text-foreground',
                                !selectedCount && 'bg-white border-border text-muted-foreground'
                              )}
                            >
                              <span>{group.group}</span>
                              <span>{selectedCount}/{group.topics.length}</span>
                            </button>
                            <button
                              type="button"
                              onClick={toggleGroupExpanded}
                              className={cn(
                                'h-9 w-9 rounded-xl border-2 flex items-center justify-center transition-colors',
                                colors.bgLight,
                                colors.borderLight,
                                'hover:border-muted-foreground/50'
                              )}
                              aria-label={isGroupExpanded ? 'Ocultar subtemas' : 'Mostrar subtemas'}
                            >
                              {isGroupExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )}

                        {isGroupExpanded && (
                          <div className="grid gap-2 pl-2">
                            {group.topics.map((topic) => {
                              const isSelected = selectedIds.has(topic.id)

                              return (
                                <button
                                  key={topic.id}
                                  onClick={() => toggleTopic(topic.id, topic.name)}
                                  className={cn(
                                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                                    'border-2',
                                    isSelected
                                      ? 'bg-emerald-400 border-foreground shadow-md'
                                      : 'bg-white border-border hover:border-muted-foreground/50 hover:bg-muted/30'
                                  )}
                                >
                                  <div className={cn(
                                    'w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
                                    isSelected
                                      ? 'bg-foreground border-foreground'
                                      : 'border-muted-foreground/40 bg-white'
                                  )}>
                                    {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                                  </div>
                                  <span className={cn(
                                    'flex-1 font-medium text-sm',
                                    isSelected ? 'text-foreground font-semibold' : 'text-muted-foreground'
                                  )}>
                                    {topic.name}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                    </div>
                  )
                })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Start Quiz Buttons - Fixed at bottom when topics selected */}
      {selectedTopics.length > 0 && (
        <div className="sticky bottom-4 pt-4 space-y-3">
          <Button
            onClick={() => handleStartQuiz('teorico')}
            disabled={isLoading}
            className={cn(
              'w-full h-14 text-lg font-bold gap-3 rounded-2xl shadow-xl transition-all',
              'bg-gradient-to-r from-[var(--algebra)] to-[var(--algebra)]/80 text-white border-0',
              'disabled:opacity-50',
              'hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
            )}
            size="lg"
          >
            <BookOpen className="w-5 h-5" />
            Empezar Cuestionario Teorico (10 preguntas)
          </Button>
          
          <Button
            onClick={() => handleStartQuiz('practico')}
            disabled={isLoading}
            className={cn(
              'w-full h-14 text-lg font-bold gap-3 rounded-2xl shadow-xl transition-all',
              'bg-gradient-to-r from-[var(--analysis)] to-[var(--analysis)]/80 text-white border-0',
              'disabled:opacity-50',
              'hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
            )}
            size="lg"
          >
            <Calculator className="w-5 h-5" />
            Empezar Cuestionario Practico (10 ejercicios)
          </Button>
        </div>
      )}
    </div>
  )
}
