'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Play, BookOpen, Calculator } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { subjects, getQuestionsForTopics } from '@/lib/data'
import { cn } from '@/lib/utils'

export function TopicSelector() {
  const { selectedSubject, setActiveView, startQuiz } = useAppStore()
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [mode, setMode] = useState<'teorico' | 'practico'>('teorico')

  const subject = useMemo(() => 
    subjects.find(s => s.id === selectedSubject),
    [selectedSubject]
  )

  if (!subject) {
    return null
  }

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveView('dashboard')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">
              {subject.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              Selecciona los temas a practicar
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 pb-32 space-y-6">
        {/* Mode Selector */}
        <Card className="p-5">
          <h2 className="font-semibold text-foreground mb-4">Modo de práctica</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                mode === 'teorico' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <Label htmlFor="mode-switch" className="font-medium cursor-pointer">
                  {mode === 'teorico' ? 'Teórico' : 'Práctico'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {mode === 'teorico' ? '20 preguntas de conceptos' : '10 ejercicios para resolver'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn(
                'text-sm font-medium transition-colors',
                mode === 'teorico' ? 'text-primary' : 'text-muted-foreground'
              )}>
                T
              </span>
              <Switch
                id="mode-switch"
                checked={mode === 'practico'}
                onCheckedChange={(checked) => setMode(checked ? 'practico' : 'teorico')}
              />
              <span className={cn(
                'text-sm font-medium transition-colors',
                mode === 'practico' ? 'text-accent' : 'text-muted-foreground'
              )}>
                P
              </span>
            </div>
          </div>
        </Card>

        {/* Select All */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Unidades y Temas</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="text-primary"
          >
            {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
          </Button>
        </div>

        {/* Units and Topics */}
        <div className="space-y-4">
          {subject.units.map((unit) => (
            <Card key={unit.id} className="overflow-hidden">
              <div className="bg-muted/50 px-4 py-3 border-b border-border">
                <h3 className="font-medium text-foreground text-sm">
                  {unit.name}
                </h3>
              </div>
              <div className="p-2">
                {unit.topics.map((topic) => (
                  <label
                    key={topic.id}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors',
                      'hover:bg-muted/50 active:bg-muted',
                      selectedTopics.includes(topic.id) && 'bg-primary/5'
                    )}
                  >
                    <Checkbox
                      checked={selectedTopics.includes(topic.id)}
                      onCheckedChange={() => handleTopicToggle(topic.id)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span className="text-foreground flex-1">{topic.name}</span>
                  </label>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </main>

      {/* Fixed Start Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
        <Button
          onClick={handleStartQuiz}
          disabled={selectedTopics.length === 0}
          className="w-full h-14 text-lg font-semibold gap-2"
          size="lg"
        >
          <Play className="w-5 h-5" />
          Comenzar ({selectedTopics.length} {selectedTopics.length === 1 ? 'tema' : 'temas'})
        </Button>
      </div>
    </div>
  )
}
