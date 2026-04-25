'use client'

import { useAppStore } from '@/lib/store'
import { subjects } from '@/lib/data'
import { SubjectCard } from './subject-card'
import { StreakBadge } from './streak-badge'
import { WeakPointsSection } from './weak-points-section'
import { GraduationCap } from 'lucide-react'

export function Dashboard() {
  const { userProgress, setSelectedSubject, setActiveView } = useAppStore()

  const handleSubjectClick = (subjectId: string) => {
    setSelectedSubject(subjectId)
    setActiveView('selector')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Malejo Math</h1>
              <p className="text-xs text-muted-foreground">Aprende a tu ritmo</p>
            </div>
          </div>
          <StreakBadge streak={userProgress.streak} size="sm" />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 pb-24 space-y-6">
        {/* Welcome Section */}
        <section>
          <h2 className="text-2xl font-bold text-foreground text-balance">
            Elige una materia para practicar
          </h2>
          <p className="text-muted-foreground mt-1">
            Selecciona los temas que quieras reforzar
          </p>
        </section>

        {/* Subject Cards */}
        <section className="grid gap-4">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onClick={() => handleSubjectClick(subject.id)}
            />
          ))}
        </section>

        {/* Weak Points Section */}
        {userProgress.weakPoints.length > 0 && (
          <WeakPointsSection weakPoints={userProgress.weakPoints} />
        )}

        {/* Stats Overview */}
        <section className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Tu progreso</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {userProgress.streak}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Racha actual
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">
                {userProgress.weakPoints.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Temas a reforzar
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {Math.round(
                  Object.values(userProgress.subjectProgress).reduce((a, b) => a + b, 0) / 3
                )}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Progreso total
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
