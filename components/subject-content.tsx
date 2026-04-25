'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Play, BookOpen, Calculator, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Subject } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { getQuestionsForTopics } from '@/lib/data'

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
    checkbox: 'data-[state=checked]:bg-[var(--algebra)] data-[state=checked]:border-[var(--algebra)]'
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
    checkbox: 'data-[state=checked]:bg-[var(--analysis)] data-[state=checked]:border-[var(--analysis)]'
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
    checkbox: 'data-[state=checked]:bg-[var(--probability)] data-[state=checked]:border-[var(--probability)]'
  }
}

export function SubjectContent({ subject }: SubjectContentProps) {
  const { startQuiz } = useAppStore()
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [mode, setMode] = useState<'teorico' | 'practico'>('teorico')
  const [expandedUnits, setExpandedUnits] = useState<string[]>([subject.units[0]?.id || ''])
  
  const colors = colorConfig[subject.id as keyof typeof colorConfig] || colorConfig.algebra

  const totalTopics = subject.units.reduce((acc, unit) => acc + unit.topics.length, 0)
  const completedTopics = subject.units.reduce(
    (acc, unit) => acc + unit.topics.filter(t => t.completed).length, 
    0
  )
  const progressPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    )
  }

  const toggleUnit = (unitId: string) => {
    setExpandedUnits(prev =>
      prev.includes(unitId)
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    )
  }

  const handleSelectAll = () => {
    const allTopicIds = subject.units.flatMap(u => u.topics.map(t => t.id))
    if (selectedTopics.length === allTopicIds.length) {
      setSelectedTopics([])
    } else {
      setSelectedTopics(allTopicIds)
    }
  }

  const handleStartQuiz = () => {
    if (selectedTopics.length === 0) return
    
    const questions = getQuestionsForTopics(selectedTopics, mode)
    startQuiz(
      {
        subject: subject.id,
        topics: selectedTopics,
        mode,
        questionCount: mode === 'teorico' ? 20 : 10
      },
      questions
    )
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

      {/* Mode Selector */}
      <Card className="p-4 border-2 border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center transition-all',
              mode === 'teorico' 
                ? cn(colors.bg, 'text-white shadow-lg', colors.shadow)
                : 'bg-muted text-muted-foreground'
            )}>
              {mode === 'teorico' ? <BookOpen className="w-5 h-5" /> : <Calculator className="w-5 h-5" />}
            </div>
            <div>
              <div className="font-bold text-foreground">
                {mode === 'teorico' ? 'Modo Teorico' : 'Modo Practico'}
              </div>
              <div className="text-xs text-muted-foreground">
                {mode === 'teorico' ? '20 preguntas conceptuales' : '10 ejercicios para resolver'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-xs font-bold px-2 py-1 rounded-full transition-colors',
              mode === 'teorico' ? cn(colors.bgLight, colors.text) : 'text-muted-foreground'
            )}>
              T
            </span>
            <Switch
              checked={mode === 'practico'}
              onCheckedChange={(checked) => setMode(checked ? 'practico' : 'teorico')}
              className={cn('[&[data-state=checked]]:bg-[var(--analysis)]')}
            />
            <span className={cn(
              'text-xs font-bold px-2 py-1 rounded-full transition-colors',
              mode === 'practico' ? 'bg-[var(--analysis-light)] text-[var(--analysis)]' : 'text-muted-foreground'
            )}>
              P
            </span>
          </div>
        </div>
      </Card>

      {/* Select All Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Sparkles className={cn('w-4 h-4', colors.text)} />
          Selecciona temas
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
          const selectedInUnit = selectedTopics.filter(id => unitTopicIds.includes(id)).length

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
                  {unit.topics.map((topic) => (
                    <label
                      key={topic.id}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all',
                        'hover:bg-white active:scale-[0.98]',
                        selectedTopics.includes(topic.id) && cn(colors.bgLight, 'border', colors.borderLight)
                      )}
                    >
                      <Checkbox
                        checked={selectedTopics.includes(topic.id)}
                        onCheckedChange={() => handleTopicToggle(topic.id)}
                        className={colors.checkbox}
                      />
                      <span className="text-foreground flex-1 font-medium text-sm">
                        {topic.name}
                      </span>
                      {topic.completed && (
                        <span className="text-xs bg-[var(--analysis)] text-white px-2 py-0.5 rounded-full font-semibold">
                          Hecho
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Start Quiz Button */}
      <div className="sticky bottom-4 pt-2">
        <Button
          onClick={handleStartQuiz}
          disabled={selectedTopics.length === 0}
          className={cn(
            'w-full h-14 text-lg font-bold gap-2 rounded-2xl shadow-xl transition-all',
            'bg-gradient-to-r text-white border-0',
            colors.gradient,
            colors.shadow,
            'disabled:opacity-50 disabled:shadow-none',
            'hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
          )}
          size="lg"
        >
          <Play className="w-5 h-5" />
          Comenzar ({selectedTopics.length} {selectedTopics.length === 1 ? 'tema' : 'temas'})
        </Button>
      </div>
    </div>
  )
}
