'use client'

import { OnboardingGate } from './onboarding-gate'
import { QuizOverlay } from './quiz-overlay'
import { Toaster } from '@/components/ui/toaster'

export function AppGuards({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingGate>
      {children}
      <QuizOverlay />
      <Toaster />
    </OnboardingGate>
  )
}
