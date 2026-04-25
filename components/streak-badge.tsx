'use client'

import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StreakBadgeProps {
  streak: number
  size?: 'sm' | 'md' | 'lg'
}

export function StreakBadge({ streak, size = 'md' }: StreakBadgeProps) {
  const isActive = streak >= 2
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base'
  }
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          'rounded-full flex items-center justify-center transition-all duration-300',
          sizeClasses[size],
          isActive 
            ? 'bg-gradient-to-br from-orange-400 to-red-500 shadow-lg shadow-orange-200 animate-pulse' 
            : 'bg-muted'
        )}
      >
        <Flame 
          className={cn(
            iconSizes[size],
            isActive ? 'text-white' : 'text-muted-foreground'
          )} 
        />
      </div>
      <span className={cn(
        'font-bold',
        isActive ? 'text-orange-500' : 'text-muted-foreground',
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm',
        size === 'lg' && 'text-lg'
      )}>
        {streak}
      </span>
      {size !== 'sm' && (
        <span className="text-xs text-muted-foreground">Racha</span>
      )}
    </div>
  )
}
