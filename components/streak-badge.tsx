'use client'

import { cn } from '@/lib/utils'
import { Flame } from 'lucide-react'

interface StreakBadgeProps {
  streak: number
  size?: 'sm' | 'md' | 'lg'
}

export function StreakBadge({ streak, size = 'md' }: StreakBadgeProps) {
  const isActive = streak >= 2

  const sizeClasses = {
    sm: 'w-11 h-11',
    md: 'w-14 h-14',
    lg: 'w-20 h-20'
  }

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10'
  }

  const textSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm'
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          'relative rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border-2',
          sizeClasses[size],
          isActive
            ? 'bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 border-orange-300 shadow-lg shadow-orange-500/40'
            : 'bg-muted border-border'
        )}
      >
        {isActive && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 blur-lg opacity-40 -z-10" />
        )}
        
        <Flame
          className={cn(
            iconSizes[size],
            'transition-all duration-300',
            isActive 
              ? 'text-white drop-shadow-lg' 
              : 'text-muted-foreground'
          )}
        />
        <span className={cn(
          'font-black leading-none',
          textSizes[size],
          isActive ? 'text-white' : 'text-muted-foreground'
        )}>
          {streak}
        </span>
      </div>
    </div>
  )
}
