'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useAppStore } from '@/lib/store'
import { OnboardingScreen } from './onboarding-screen'

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [forceOnboarded, setForceOnboarded] = useState(false)
  const resetQuiz = useAppStore((state) => state.resetQuiz)

  useEffect(() => {
    resetQuiz()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (status === 'loading') return null

  if (status === 'authenticated' && !session?.user?.isOnboarded && !forceOnboarded) {
    return <OnboardingScreen onComplete={() => setForceOnboarded(true)} />
  }

  return <>{children}</>
}
