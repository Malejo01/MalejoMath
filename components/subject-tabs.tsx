'use client'

import { cn } from '@/lib/utils'
import { BookOpen, TrendingUp, BarChart3 } from 'lucide-react'
import type { Subject } from '@/lib/types'

interface SubjectTabsProps {
  subjects: Subject[]
  activeSubject: string | null
  onSelect: (subjectId: string) => void
}

const iconMap = {
  algebra: BookOpen,
  analysis: TrendingUp,
  probability: BarChart3
}

const colorConfig = {
  algebra: {
    active: 'bg-[var(--algebra)] text-white border-[var(--algebra)] shadow-lg shadow-[var(--algebra)]/30',
    inactive: 'bg-[var(--algebra-light)] text-[var(--algebra)] border-[var(--algebra)]/30 hover:border-[var(--algebra)]/50',
    icon: 'text-[var(--algebra)]',
    iconActive: 'text-white'
  },
  analisis: {
    active: 'bg-[var(--analysis)] text-white border-[var(--analysis)] shadow-lg shadow-[var(--analysis)]/30',
    inactive: 'bg-[var(--analysis-light)] text-[var(--analysis)] border-[var(--analysis)]/30 hover:border-[var(--analysis)]/50',
    icon: 'text-[var(--analysis)]',
    iconActive: 'text-white'
  },
  probabilidad: {
    active: 'bg-[var(--probability)] text-white border-[var(--probability)] shadow-lg shadow-[var(--probability)]/30',
    inactive: 'bg-[var(--probability-light)] text-[var(--probability)] border-[var(--probability)]/30 hover:border-[var(--probability)]/50',
    icon: 'text-[var(--probability)]',
    iconActive: 'text-white'
  }
}

export function SubjectTabs({ subjects, activeSubject, onSelect }: SubjectTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
      {subjects.map((subject) => {
        const Icon = iconMap[subject.icon as keyof typeof iconMap] || BookOpen
        const isActive = activeSubject === subject.id
        const colors = colorConfig[subject.id as keyof typeof colorConfig] || colorConfig.algebra
        
        // Calculate progress
        const totalTopics = subject.units.reduce((acc, unit) => acc + unit.topics.length, 0)
        const completedTopics = subject.units.reduce(
          (acc, unit) => acc + unit.topics.filter(t => t.completed).length, 
          0
        )
        const progressPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0

        return (
          <button
            key={subject.id}
            onClick={() => onSelect(subject.id)}
            className={cn(
              'flex-1 min-w-[100px] max-w-[140px] flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-200',
              'active:scale-95 touch-manipulation',
              isActive ? colors.active : colors.inactive
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
              isActive ? 'bg-white/20' : 'bg-white shadow-sm'
            )}>
              <Icon className={cn('w-5 h-5', isActive ? colors.iconActive : colors.icon)} />
            </div>
            <span className="text-xs font-bold truncate w-full text-center">
              {subject.name.split(' ')[0]}
            </span>
            <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden">
              <div 
                className={cn(
                  'h-full rounded-full transition-all',
                  isActive ? 'bg-white' : 'bg-current opacity-60'
                )}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className={cn(
              'text-[10px] font-semibold',
              isActive ? 'text-white/90' : 'opacity-70'
            )}>
              {progressPercentage}%
            </span>
          </button>
        )
      })}
    </div>
  )
}
