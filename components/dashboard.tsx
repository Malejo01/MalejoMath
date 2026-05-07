'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { subjects } from '@/lib/data'
import { teacherProgramToSubject } from '@/lib/teacher-programs'
import { SubjectTabs } from './subject-tabs'
import { SubjectContent } from './subject-content'
import { StreakBadge } from './streak-badge'
import { WeakPointsSection } from './weak-points-section'
import { MathBackground } from './math-background'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navbar } from './navbar'
import { Target, TrendingUp, Sigma, LineChart, BarChart3, BookOpen, Upload } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { TeacherProgramUploadModal } from './teacher-program-upload-modal'
import type { TeacherProgram } from '@/lib/types'

type TeacherProgramApiShape = TeacherProgram & {
  user_id?: string
  subject_name?: string
  pedagogy_profile?: TeacherProgram['pedagogyProfile']
  source_file_name?: string | null
  created_at?: string
}

function normalizeTeacherProgram(program: TeacherProgramApiShape): TeacherProgram {
  return {
    id: Number(program.id),
    userId: program.userId ?? program.user_id ?? '',
    subjectName: program.subjectName ?? program.subject_name ?? 'Materia docente',
    pedagogyProfile: program.pedagogyProfile ?? program.pedagogy_profile ?? {
      level: 'No especificado',
      degree: 'No especificado',
      academicYear: 'No especificado',
      complexity: 'No especificado',
      assessmentStyle: 'mixto',
      methodology: 'No especificado',
    },
    units: Array.isArray(program.units) ? program.units : [],
    sourceFileName: program.sourceFileName ?? program.source_file_name ?? null,
    createdAt: program.createdAt ?? program.created_at ?? new Date().toISOString(),
  }
}

export function Dashboard() {
  const { userProgress, userProfile, teacherPrograms, clearSelectedTopics, setSelectedSubject, setTeacherPrograms, addTeacherProgram } = useAppStore()
  const { isSignedIn } = useAuth()
  const [activeSubject, setActiveSubject] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)

  const teacherSubjects = teacherPrograms.map((program) => teacherProgramToSubject(program))
  const allSubjects = [...subjects, ...teacherSubjects]
  
  // Clear selected topics when dashboard mounts (fresh start)
  useEffect(() => {
    clearSelectedTopics()
  }, [clearSelectedTopics])

  useEffect(() => {
    if (!isSignedIn || userProfile?.role !== 'teacher') {
      setTeacherPrograms([])
      return
    }

    let isMounted = true

    const loadPrograms = async () => {
      try {
        const response = await fetch('/api/teacher/programs')
        const data = await response.json()

        if (!response.ok || !isMounted) {
          return
        }

        const normalizedPrograms = (Array.isArray(data.programs) ? data.programs : [])
          .map((program) => normalizeTeacherProgram(program as TeacherProgramApiShape))

        setTeacherPrograms(normalizedPrograms)
      } catch {
        if (isMounted) {
          setTeacherPrograms([])
        }
      }
    }

    loadPrograms()

    return () => {
      isMounted = false
    }
  }, [isSignedIn, userProfile?.role, setTeacherPrograms])
  
  const handleSubjectChange = (subjectId: string | null) => {
    setActiveSubject(subjectId)
    setSelectedSubject(subjectId)
  }

  const selectedSubject = allSubjects.find(s => s.id === activeSubject)
  const selectedSubjectAverage = activeSubject
    ? (userProgress.subjectAverages?.[activeSubject] ?? 0)
    : 0

  const selectedSubjectAttempts = activeSubject
    ? (userProgress.subjectAttemptCounts?.[activeSubject] ?? 0)
    : 0

  const averageCardConfig = {
    algebra: {
      icon: Sigma,
      iconBg: 'bg-[var(--algebra-light)]',
      iconText: 'text-[var(--algebra)]',
      title: 'Tu promedio en Algebra',
    },
    analisis: {
      icon: LineChart,
      iconBg: 'bg-[var(--analysis-light)]',
      iconText: 'text-[var(--analysis)]',
      title: 'Tu promedio en Analisis',
    },
    probabilidad: {
      icon: BarChart3,
      iconBg: 'bg-[var(--probability-light)]',
      iconText: 'text-[var(--probability)]',
      title: 'Tu promedio en Probabilidad',
    },
    default: {
      icon: BookOpen,
      iconBg: 'bg-muted',
      iconText: 'text-muted-foreground',
      title: 'Selecciona una materia',
    }
  }

  const currentAverageCard = activeSubject
    ? averageCardConfig[activeSubject as keyof typeof averageCardConfig] ?? averageCardConfig.default
    : averageCardConfig.default

  const AverageIcon = currentAverageCard.icon
  
  const totalProgress = Math.round(
    Object.values(userProgress.subjectProgress).reduce((a, b) => a + b, 0) / 3
  )

  return (
    <div className="min-h-screen relative">
      <MathBackground />
      
      <Navbar />

      {/* Main Content */}
      <main className="px-4 py-5 pb-8 space-y-5">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 border-2 border-border bg-card/80 backdrop-blur-sm">
            <div className="flex flex-col items-center text-center gap-1">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${currentAverageCard.iconBg}`}>
                <AverageIcon className={`w-5 h-5 ${currentAverageCard.iconText}`} />
              </div>
              <div className="text-lg font-black text-foreground leading-none">
                {activeSubject ? selectedSubjectAverage.toFixed(2) : '--'}
              </div>
              <div className="text-[10px] text-muted-foreground font-semibold leading-tight">
                {currentAverageCard.title}
              </div>
              <div className="text-[10px] text-muted-foreground/80">
                {activeSubject ? `${selectedSubjectAttempts} evaluaciones` : 'Sin materia elegida'}
              </div>
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
          {userProfile?.role === 'teacher' && (
            <div className="mb-3">
              <Button onClick={() => setShowUploadModal(true)} className="rounded-xl font-bold">
                <Upload className="w-4 h-4 mr-2" />
                Subir Programa
              </Button>
            </div>
          )}
          <SubjectTabs 
            subjects={allSubjects} 
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

      <TeacherProgramUploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onProgramCreated={addTeacherProgram}
      />
    </div>
  )
}
