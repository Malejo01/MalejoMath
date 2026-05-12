'use client'

import { useEffect, useState } from 'react'
import { GraduationCap, LogIn, ClipboardList } from 'lucide-react'
import { SignInButton, Show, UserButton, useAuth } from '@clerk/nextjs'
import { StreakBadge } from './streak-badge'
import { useAppStore } from '@/lib/store'
import Link from 'next/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { UserRole } from '@/lib/types'

export function Navbar() {
  const { userProgress, userProfile, setUserProfile, setUserRole } = useAppStore()
  const { isSignedIn } = useAuth()
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)

  useEffect(() => {
    if (!isSignedIn) return

    let isMounted = true

    const loadProfile = async () => {
      try {
        const response = await fetch('/api/user/profile')
        const data = await response.json()
        if (!response.ok || !isMounted) return
        setUserProfile(data.profile)
      } catch {
        // ignore profile bootstrap errors in navbar
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [isSignedIn, setUserProfile])

  const handleRoleChange = async (nextRole: UserRole) => {
    setIsUpdatingRole(true)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo cambiar el rol')
      }

      setUserProfile(data.profile)
      setUserRole(data.profile.role)
    } catch {
      // keep current role state on failure
    } finally {
      setIsUpdatingRole(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-sm transition-all duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -inset-1 bg-primary/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-foreground tracking-[0.04em] leading-none [font-family:var(--font-brand)]">Malejo Math</h1>
            <p className="text-[9px] text-muted-foreground/70 font-semibold uppercase tracking-[0.18em] mt-0.5">Mastery Learning</p>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          <div className="hidden xs:block">
            <StreakBadge streak={userProgress.streak} size="sm" />
          </div>

          <div className="h-8 w-[1px] bg-border/50 mx-1 hidden xs:block" />

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:shadow-lg hover:bg-primary/90 transition-all active:scale-95">
                <LogIn className="w-4 h-4" />
                <span>Ingresar</span>
              </button>
            </SignInButton>
          </Show>

          <Show when="signed-in">
            <div className="flex items-center gap-3">
              <Select
                value={userProfile?.role || 'student'}
                onValueChange={(value) => handleRoleChange(value as UserRole)}
                disabled={isUpdatingRole}
              >
                <SelectTrigger className="h-9 w-[130px] rounded-xl bg-secondary border-border/60">
                  <SelectValue placeholder="Modo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Alumno</SelectItem>
                  <SelectItem value="teacher">Docente</SelectItem>
                </SelectContent>
              </Select>

              <Link href="/history">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-bold text-sm hover:bg-secondary/80 transition-all active:scale-95 border border-border/50">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  <span className="hidden sm:inline">Historial Evaluaciones</span>
                </button>
              </Link>
              
              <UserButton 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-9 h-9 border-2 border-primary/20 hover:border-primary transition-colors",
                    userButtonTrigger: "focus:shadow-none focus:outline-none"
                  }
                }}
                afterSignOutUrl="/"
              />
            </div>
          </Show>
        </div>
      </div>
    </header>
  )
}
