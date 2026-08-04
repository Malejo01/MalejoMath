'use client'

import { FeedbackButton } from './feedback-button'
import { OnboardingGate } from './onboarding-gate'
import { QuizOverlay } from './quiz-overlay'
import { Toaster } from '@/components/ui/toaster'

export function AppGuards({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingGate>
      {children}
      <QuizOverlay />
      {/*
        Acá y no en el Navbar: este componente envuelve los dos grupos de rutas
        ((app) y (focus)), así que un solo montaje cubre docente, alumno e
        invitado, y sobre todo sigue estando durante el quiz — que es cuando
        aparece la mayoría de los problemas que vale la pena reportar. El
        Navbar, en cambio, no existe en (focus) y queda tapado por QuizOverlay.
      */}
      <FeedbackButton />
      <Toaster />
    </OnboardingGate>
  )
}
