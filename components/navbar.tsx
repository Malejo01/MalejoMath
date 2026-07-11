'use client'

import { useEffect, useState, useRef } from 'react'
import { GraduationCap, LogIn, ClipboardList, LogOut, ChevronDown } from 'lucide-react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { StreakBadge } from './streak-badge'
import { useAppStore } from '@/lib/store'
import Link from 'next/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { UserRole } from '@/lib/types'

export function Navbar() {
  const { userProgress, userProfile, setUserProfile, setUserRole } = useAppStore()
  const { data: session, status, update: updateSession } = useSession()
  const isSignedIn = status === 'authenticated'
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
      // Refresh the JWT so the new role is reflected in the session
      await updateSession()
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

          {/* Signed-out state */}
          {!isSignedIn && (
            <button
              onClick={() => signIn('google')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:shadow-lg hover:bg-primary/90 transition-all active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Ingresar</span>
            </button>
          )}

          {/* Signed-in state */}
          {isSignedIn && (
            <div className="flex items-center gap-3">
              <Select
                value={userProfile?.role ?? ''}
                onValueChange={(value) => handleRoleChange(value as UserRole)}
                disabled={isUpdatingRole}
              >
                <SelectTrigger className="h-9 w-[130px] rounded-xl bg-secondary border-border/60">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALUMNO">Alumno</SelectItem>
                  <SelectItem value="DOCENTE">Docente</SelectItem>
                </SelectContent>
              </Select>

              <Link href="/history">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-bold text-sm hover:bg-secondary/80 transition-all active:scale-95 border border-border/50">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  <span className="hidden sm:inline">Historial Evaluaciones</span>
                </button>
              </Link>

              {/* User avatar + dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary px-2 py-1.5 hover:bg-secondary/80 transition-all"
                  aria-label="Menú de usuario"
                >
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name ?? 'Usuario'}
                      className="w-7 h-7 rounded-full border-2 border-primary/20"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      {session?.user?.name?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border/50 rounded-xl shadow-lg py-1 z-50">
                    <div className="px-3 py-2 border-b border-border/40">
                      <p className="text-sm font-medium text-foreground truncate">{session?.user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

