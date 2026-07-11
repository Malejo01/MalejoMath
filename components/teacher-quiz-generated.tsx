'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useAppStore } from '@/lib/store'
import { exportQuizToMoodleGift } from '@/lib/moodle-export'
import { MathBackground } from '@/components/math-background'
import { LaTeXRenderer } from '@/components/latex-renderer'
import { Navbar } from './navbar'
import {
  Download, Save, PlayCircle, Trash2, ChevronDown, ChevronUp,
  ArrowLeft, Loader2, CheckCircle, GraduationCap, Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Question } from '@/lib/types'
import type { CurriculumSelection } from './curriculum-selector'
import { useToast } from '@/hooks/use-toast'

interface TeacherQuizGeneratedProps {
  questions: Question[]
  selection: CurriculumSelection
  onBack: () => void
}

export function TeacherQuizGenerated({ questions: initialQuestions, selection, onBack }: TeacherQuizGeneratedProps) {
  const { data: session } = useSession()
  const { startQuiz } = useAppStore()
  const { toast } = useToast()

  const [questions, setQuestions] = useState<Question[]>(() => {
    const seen = new Set<string>()
    return initialQuestions.map((q, idx) => {
      let uniqueId = q.id || `q-${idx}`
      if (seen.has(uniqueId)) {
        uniqueId = `${uniqueId}-${idx}`
      }
      seen.add(uniqueId)
      return { ...q, id: uniqueId }
    })
  })
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQuestionText, setEditQuestionText] = useState('')
  const [editOptions, setEditOptions] = useState<string[]>([])
  const [editCorrectAnswer, setEditCorrectAnswer] = useState<number>(0)
  const [editExplanation, setEditExplanation] = useState('')

  const removeQuestion = useCallback((id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }, [])

  const toggleExpand = (id: string) => setExpandedId((prev) => (prev === id ? null : id))

  const startEditing = (q: Question) => {
    setEditingId(q.id)
    setEditQuestionText(q.question)
    setEditOptions([...q.options])
    setEditCorrectAnswer(q.correctAnswer)
    setEditExplanation(q.explanation || '')
  }

  const saveQuestionEdit = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              question: editQuestionText,
              options: editOptions,
              correctAnswer: editCorrectAnswer,
              explanation: editExplanation,
            }
          : q
      )
    )
    setEditingId(null)
  }

  const cancelQuestionEdit = () => {
    setEditingId(null)
  }

  // ── Export to Moodle GIFT ──────────────────────────────────────────────────
  const handleExportMoodle = () => {
    // Build a TeacherQuiz-compatible shape from the current questions + metadata
    const quizForExport = {
      id: 0,
      userId: session?.user?.id ?? '',
      teacherProgramId: 0,
      title: `${selection.materia} - ${selection.grado}`,
      subjectName: selection.materia,
      mode: selection.mode,
      status: 'saved' as const,
      selectedTopics: selection.selectedTopics.map((t) => ({ id: t.id, name: t.name })),
      questionCount: questions.length,
      questions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const gift = exportQuizToMoodleGift(quizForExport)
    const blob = new Blob([gift], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selection.materia.replace(/\s+/g, '_')}_moodle.gift.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Save quiz to DB ────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      // Ensure a teacher program exists for this subject (creates one if needed)
      const programRes = await fetch('/api/teacher/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: selection.materia,
          iconName: 'book-open',
          colorName: 'teal',
          units: Object.entries(
            selection.selectedTopics.reduce<Record<string, string[]>>((acc, t) => {
              if (!acc[t.eje]) acc[t.eje] = []
              acc[t.eje].push(t.name)
              return acc
            }, {})
          ).map(([eje, temas]) => ({
            id: eje, name: eje,
            topics: temas.map((n) => ({ id: n, name: n })),
          })),
          pedagogyProfile: {
            level: selection.nivel,
            degree: selection.grado,
            academicYear: selection.grado,
            complexity: selection.difficulty,
            assessmentStyle: selection.mode,
            methodology: 'Generado desde Currícula Oficial',
          },
        }),
      })
      const programData = await programRes.json()
      const programId = programData?.program?.id
      if (!programId) throw new Error(programData?.error ?? 'No se pudo crear el programa')

      const quizRes = await fetch('/api/teacher/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherProgramId: programId,
          title: `${selection.materia} · ${selection.grado} · ${new Date().toLocaleDateString('es-AR')}`,
          subjectName: selection.materia,
          mode: selection.mode,
          status: 'saved',
          selectedTopics: selection.selectedTopics.map((t) => ({ id: t.id, name: t.name })),
          questionCount: questions.length,
          questions,
          pedagogyContext: `Nivel: ${selection.nivel} | Dificultad: ${selection.difficulty}`,
        }),
      })
      if (!quizRes.ok) {
        const d = await quizRes.json()
        throw new Error(d?.error ?? 'Error al guardar')
      }
      setSaved(true)
      toast({
        title: 'Cuestionario guardado',
        description: 'El cuestionario ha sido guardado correctamente en tu panel.',
      })
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Error desconocido'
      setSaveError(errMsg)
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: `No se pudo guardar el cuestionario: ${errMsg}. Por favor, intenta de nuevo.`,
      })
    } finally {
      setSaving(false)
    }
  }

  // ── Send to quiz engine (preview mode) ────────────────────────────────────
  const handlePreviewAsAlumno = () => {
    startQuiz(
      {
        subject: selection.materia,
        subjectName: selection.materia,
        topics: selection.selectedTopics.map((t) => ({ id: t.id, name: t.name })),
        mode: selection.mode,
        questionCount: questions.length,
        previewOnly: true,
      },
      questions,
    )
  }

  return (
    <div className="relative min-h-screen bg-background">
      <MathBackground />
      <Navbar />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-0.5">Cuestionario generado</p>
            <h1 className="text-xl font-bold text-foreground">{selection.materia}</h1>
            <p className="text-sm text-muted-foreground">{selection.grado} · {selection.nivel} · {questions.length} preguntas · {selection.mode}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Action toolbar */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-card hover:bg-secondary transition-all disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : saved ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Save className="w-5 h-5 text-primary" />}
            <span className="text-xs font-semibold">{saved ? 'Guardado' : 'Guardar'}</span>
          </button>

          <button
            onClick={handleExportMoodle}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-card hover:bg-secondary transition-all"
          >
            {/* Moodle logo-inspired icon */}
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none" className="flex-shrink-0">
              <rect width="48" height="48" rx="8" fill="#f98012"/>
              <path d="M10 32V20c0-4.4 3.6-8 8-8h4c2.2 0 4 1.8 4 4s-1.8 4-4 4h-4v12H10z" fill="white"/>
              <path d="M28 32V20h4c2.2 0 4 1.8 4 4v8h-4v-8h-4z" fill="white"/>
            </svg>
            <span className="text-xs font-semibold">Moodle</span>
          </button>

          <button
            onClick={handlePreviewAsAlumno}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-card hover:bg-secondary transition-all"
          >
            <PlayCircle className="w-5 h-5 text-violet-500" />
            <span className="text-xs font-semibold">Vista previa</span>
          </button>
        </div>

        {saveError && <p className="text-xs text-destructive mb-4">{saveError}</p>}
        {saved && <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-4">Cuestionario guardado correctamente en tu panel.</p>}

        {/* Questions list */}
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div key={q.id} className="border border-border rounded-2xl overflow-hidden bg-card">
              {/* Question header */}
              <div
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(q.id)}
                  className="flex-1 flex items-start gap-3 text-left focus:outline-none"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-sm text-foreground leading-snug">
                    <LaTeXRenderer content={q.question} />
                  </span>
                </button>
                <div className="flex items-center gap-2 flex-shrink-0 self-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (expandedId !== q.id) setExpandedId(q.id)
                      startEditing(q)
                    }}
                    className="p-1 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    aria-label="Editar pregunta"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Eliminar pregunta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleExpand(q.id)}
                    className="p-1 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    aria-label={expandedId === q.id ? "Contraer" : "Expandir"}
                  >
                    {expandedId === q.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>

              {/* Expanded options or editor */}
              {expandedId === q.id && (
                editingId === q.id ? (
                  <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-4">
                    {/* Question statement edit */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Pregunta / Enunciado:</label>
                      <textarea
                        value={editQuestionText}
                        onChange={(e) => setEditQuestionText(e.target.value)}
                        className="w-full min-h-[80px] px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Escribe la pregunta..."
                      />
                    </div>

                    {/* Options edit */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">Opciones y respuesta correcta:</label>
                      {editOptions.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={editCorrectAnswer === oi}
                            onChange={() => setEditCorrectAnswer(oi)}
                            className="w-4 h-4 text-primary focus:ring-primary flex-shrink-0 cursor-pointer"
                          />
                          <span className="font-bold text-sm flex-shrink-0">{String.fromCharCode(65 + oi)}.</span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...editOptions]
                              newOpts[oi] = e.target.value
                              setEditOptions(newOpts)
                            }}
                            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder={`Opción ${String.fromCharCode(65 + oi)}`}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Explanation edit */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Explicación (opcional):</label>
                      <textarea
                        value={editExplanation}
                        onChange={(e) => setEditExplanation(e.target.value)}
                        className="w-full min-h-[60px] px-3 py-1.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Escribe la explicación..."
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={cancelQuestionEdit}
                        className="px-3 py-1.5 rounded-xl border border-border text-xs hover:bg-secondary transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => saveQuestionEdit(q.id)}
                        className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-2">
                    {q.options.map((opt, oi) => (
                      <div
                        key={oi}
                        className={cn(
                          'flex items-start gap-2 px-3 py-2 rounded-xl text-sm',
                          oi === q.correctAnswer
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                            : 'bg-secondary/40 text-muted-foreground'
                        )}
                      >
                        <span className="font-bold flex-shrink-0">{String.fromCharCode(65 + oi)}.</span>
                        <LaTeXRenderer content={opt} />
                      </div>
                    ))}
                    {q.explanation && (
                      <div className="mt-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                        <span className="font-semibold text-primary">Explicación: </span>
                        <LaTeXRenderer content={q.explanation} />
                      </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => startEditing(q)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Editar pregunta
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          ))}
        </div>

        {questions.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Todas las preguntas fueron eliminadas.
          </div>
        )}
      </div>
    </div>
  )
}
