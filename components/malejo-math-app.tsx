'use client'

import { useAppStore } from '@/lib/store'
import { Dashboard } from './dashboard'
import { QuizEngine } from './quiz-engine'
import { ResultsScreen } from './results-screen'

export function MalejoMathApp() {
  const { activeView } = useAppStore()

  return (
    <div className="max-w-lg mx-auto min-h-screen">
      {(activeView === 'dashboard' || activeView === 'selector') && <Dashboard />}
      {activeView === 'quiz' && <QuizEngine />}
      {activeView === 'results' && <ResultsScreen />}
    </div>
  )
}
