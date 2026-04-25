'use client'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { BookOpen, TrendingUp, BarChart3 } from 'lucide-react'
import type { Subject } from '@/lib/types'

interface SubjectCardProps {
  subject: Subject
  onClick: () => void
}

const iconMap = {
  algebra: BookOpen,
  analysis: TrendingUp,
  probability: BarChart3
}

const colorMap = {
  primary: 'bg-primary/10 border-primary/20 hover:border-primary/40',
  accent: 'bg-accent/10 border-accent/20 hover:border-accent/40',
  warning: 'bg-warning/10 border-warning/20 hover:border-warning/40'
}

const iconColorMap = {
  primary: 'text-primary',
  accent: 'text-accent',
  warning: 'text-warning'
}

const progressColorMap = {
  primary: '[&>div]:bg-primary',
  accent: '[&>div]:bg-accent',
  warning: '[&>div]:bg-warning'
}

export function SubjectCard({ subject, onClick }: SubjectCardProps) {
  const Icon = iconMap[subject.icon as keyof typeof iconMap] || BookOpen
  const colorClass = colorMap[subject.color as keyof typeof colorMap] || colorMap.primary
  const iconColor = iconColorMap[subject.color as keyof typeof iconColorMap] || iconColorMap.primary
  const progressColor = progressColorMap[subject.color as keyof typeof progressColorMap] || progressColorMap.primary
  
  const totalTopics = subject.units.reduce((acc, unit) => acc + unit.topics.length, 0)
  const completedTopics = subject.units.reduce(
    (acc, unit) => acc + unit.topics.filter(t => t.completed).length, 
    0
  )
  const progressPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0

  return (
    <Card
      className={cn(
        'p-5 cursor-pointer transition-all duration-200 border-2',
        'active:scale-[0.98] touch-manipulation',
        colorClass
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          'bg-background shadow-sm'
        )}>
          <Icon className={cn('w-6 h-6', iconColor)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-lg leading-tight">
            {subject.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {subject.units.length} unidades
          </p>
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progreso</span>
          <span className="font-medium">{Math.round(progressPercentage)}%</span>
        </div>
        <Progress 
          value={progressPercentage} 
          className={cn('h-2 bg-muted', progressColor)}
        />
      </div>
    </Card>
  )
}
