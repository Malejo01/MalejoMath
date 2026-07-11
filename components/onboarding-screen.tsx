'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { GraduationCap, BookOpen, Loader2 } from 'lucide-react'
import { MathBackground } from '@/components/math-background'
import { useRouter } from 'next/navigation'

interface OnboardingScreenProps {
  onComplete: () => void
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { update: updateSession } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState<'ALUMNO' | 'DOCENTE' | null>(null)

  const selectRole = async (role: 'ALUMNO' | 'DOCENTE') => {
    setLoading(role)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error('Error al guardar el rol')

      // Refresh JWT so session.user.role and isOnboarded are updated
      await updateSession()
      router.refresh()
      onComplete()
    } catch {
      setLoading(null)
    }
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-background overflow-hidden">
      <MathBackground />

      <div className="relative z-10 w-full max-w-lg mx-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 shadow-xl mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">¡Bienvenido/a a Malejo Math!</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Para personalizar tu experiencia, contanos cómo vas a usar la plataforma.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* ALUMNO */}
          <button
            onClick={() => selectRole('ALUMNO')}
            disabled={loading !== null}
            className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-foreground">Soy Alumno/a</h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Quiero practicar, realizar cuestionarios y ver mi historial de aprendizaje.
              </p>
            </div>
            {loading === 'ALUMNO' && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/70">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </button>

          {/* DOCENTE */}
          <button
            onClick={() => selectRole('DOCENTE')}
            disabled={loading !== null}
            className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <GraduationCap className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-foreground">Soy Docente</h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Quiero generar cuestionarios, exportarlos a Moodle y gestionar mis programas.
              </p>
            </div>
            {loading === 'DOCENTE' && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/70">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Podés cambiar tu rol en cualquier momento desde el menú superior.
        </p>
      </div>
    </div>
  )
}
