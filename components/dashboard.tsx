'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { subjects } from '@/lib/data'
import { SubjectTabs } from './subject-tabs'
import { SubjectContent } from './subject-content'
import { StreakBadge } from './streak-badge'
import { WeakPointsSection } from './weak-points-section'
import { MathBackground } from './math-background'
import { Card } from '@/components/ui/card'
import { GraduationCap, Target, Flame, TrendingUp } from 'lucide-react'

export function Dashboard() {
  const { userProgress, clearSelectedTopics, setSelectedSubject } = useAppStore()
  const [activeSubject, setActiveSubject] = useState<string | null>(null)
  
  // Clear selected topics when dashboard mounts (fresh start)
  useEffect(() => {
    clearSelectedTopics()
  }, [clearSelectedTopics])
  
  const handleSubjectChange = (subjectId: string | null) => {
    setActiveSubject(subjectId)
    setSelectedSubject(subjectId)
  }

  const selectedSubject = subjects.find(s => s.id === activeSubject)
  
  const totalProgress = Math.round(
    Object.values(userProgress.subjectProgress).reduce((a, b) => a + b, 0) / 3
  )

  return (
    <div className="min-h-screen relative">
      <MathBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card/90 backdrop-blur-xl border-b-2 border-border shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[var(--algebra)] to-[var(--analysis)] flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-foreground tracking-tight">Malejo Math</h1>
              <p className="text-xs text-muted-foreground font-medium">Aprende a tu ritmo</p>
            </div>
          </div>
          <StreakBadge streak={userProgress.streak} size="sm" />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-5 pb-8 space-y-5">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 border-2 border-border bg-card/80 backdrop-blur-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-9 h-9 rounded-xl bg-[var(--algebra-light)] flex items-center justify-center mb-1.5">
                <Flame className="w-5 h-5 text-[var(--algebra)]" />
              </div>
              <div className="text-xl font-black text-foreground">{userProgress.streak}</div>
              <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Racha</div>
            </div>
          </Card>
          
          <Card className="p-3 border-2 border-border bg-card/80 backdrop-blur-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-9 h-9 rounded-xl bg-[var(--analysis-light)] flex items-center justify-center mb-1.5">
                <TrendingUp className="w-5 h-5 text-[var(--analysis)]" />
              </div>
              <div className="text-xl font-black text-foreground">{totalProgress}%</div>
              <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Progreso</div>
            </div>
          </Card>
          
          <Card className="p-3 border-2 border-border bg-card/80 backdrop-blur-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-9 h-9 rounded-xl bg-[var(--probability-light)] flex items-center justify-center mb-1.5">
                <Target className="w-5 h-5 text-[var(--probability)]" />
              </div>
              <div className="text-xl font-black text-foreground">{userProgress.weakPoints.length}</div>
              <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Reforzar</div>
            </div>
          </Card>
        </div>

        {/* Subject Tabs */}
        <section>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">
            Materias
          </h2>
          <SubjectTabs 
            subjects={subjects} 
            activeSubject={activeSubject}
            onSelect={handleSubjectChange}
          />
        </section>

        {/* Active Subject Content */}
        {selectedSubject && (
          <section className="mt-2">
            <SubjectContent subject={selectedSubject} />
          </section>
        )}

        {/* Weak Points Section */}
        {userProgress.weakPoints.length > 0 && (
          <WeakPointsSection weakPoints={userProgress.weakPoints} />
        )}
      </main>
    </div>
  )
}
