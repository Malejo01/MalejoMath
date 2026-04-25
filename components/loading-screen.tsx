'use client'

import { useEffect, useState } from 'react'
import { MathBackground } from './math-background'
import { cn } from '@/lib/utils'
import { Brain, Sparkles } from 'lucide-react'

export function LoadingScreen() {
  const [countdown, setCountdown] = useState(3)
  const [showPreparing, setShowPreparing] = useState(true)

  useEffect(() => {
    // Show "Preparando" for 1 second, then start countdown
    const prepTimer = setTimeout(() => {
      setShowPreparing(false)
    }, 1000)

    return () => clearTimeout(prepTimer)
  }, [])

  useEffect(() => {
    if (showPreparing) return

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(c => c - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown, showPreparing])

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center">
      <MathBackground />
      
      <div className="relative z-10 text-center px-8">
        {/* Animated Icon */}
        <div className={cn(
          'w-28 h-28 mx-auto mb-8 rounded-3xl flex items-center justify-center',
          'bg-gradient-to-br from-[var(--algebra)] to-[var(--analysis)]',
          'shadow-2xl shadow-[var(--algebra)]/40',
          'animate-pulse'
        )}>
          <Brain className="w-14 h-14 text-white" />
        </div>

        {/* Loading Text */}
        {showPreparing ? (
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-foreground">
              Preparando tu cuestionario...
            </h2>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Sparkles className="w-5 h-5 text-[var(--algebra)] animate-spin" />
              <span className="font-medium">Generando preguntas con IA</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">
              Listo para comenzar
            </h2>
            
            {/* Countdown */}
            <div className={cn(
              'w-24 h-24 mx-auto rounded-3xl flex items-center justify-center',
              'bg-gradient-to-br from-[var(--analysis)] to-[var(--probability)]',
              'shadow-xl transition-all duration-300',
              countdown === 0 && 'scale-110'
            )}>
              <span className="text-5xl font-black text-white">
                {countdown === 0 ? '!' : countdown}
              </span>
            </div>
            
            <p className="text-muted-foreground font-medium">
              {countdown > 0 ? 'Concentrate...' : 'Comenzando...'}
            </p>
          </div>
        )}

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'w-3 h-3 rounded-full transition-all duration-300',
                (showPreparing || countdown > 2 - i)
                  ? 'bg-muted scale-75'
                  : 'bg-gradient-to-r from-[var(--algebra)] to-[var(--analysis)] scale-100'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
