'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Dashboard } from './dashboard'
import { QuizEngine } from './quiz-engine'
import { ResultsScreen } from './results-screen'
import { LoadingScreen } from './loading-screen'
import { Toaster } from '@/components/ui/toaster'

export function MalejoMathApp() {
  const { activeView, currentQuiz, resetQuiz } = useAppStore()

  // Forzar inicio limpio al montar la app por primera vez
  useEffect(() => {
    resetQuiz()
  }, []) // Solo se ejecuta una vez al cargar la pagina

  return (
    <div className="max-w-lg mx-auto min-h-screen">
      {(activeView === 'dashboard' || activeView === 'selector') && <Dashboard />}
      {activeView === 'loading' && <LoadingScreen />}
      {activeView === 'quiz' && <QuizEngine />}
      {activeView === 'results' && <ResultsScreen />}
      <Toaster />
    </div>
  )
}
