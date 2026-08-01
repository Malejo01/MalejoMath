'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react'
import { NIVEL_OPTIONS } from '@/lib/nivel-options'
import { DEFAULT_JURISDICTION } from '@/lib/curriculum-config'
import { SUBJECT_COLOR_OPTIONS, SUBJECT_ICON_OPTIONS, SUBJECT_COLOR_CLASS } from '@/lib/subject-appearance'
import { SUBJECT_ICON_COMPONENTS } from '@/lib/subject-icons'
import { ProgramFileImport, type ProgramSourceMeta } from '@/components/program-file-import'
import type {
  Nivel,
  PedagogyProfile,
  ProgramCreatedFrom,
  ProgramUnit,
  SubjectColorName,
  SubjectIconName,
  TeacherProgram,
} from '@/lib/types'

interface TeacherSubjectWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProgramCreated: (program: TeacherProgram) => void
  onProgramUpdated?: (program: TeacherProgram) => void
  programToEdit?: TeacherProgram | null
}

interface CurriculumAxis {
  eje: string
  temas: string[]
}

type StepId = 1 | 2 | 3 | 4

const STEPS: { id: StepId; label: string }[] = [
  { id: 1, label: 'Nivel y año' },
  { id: 2, label: 'Materia' },
  { id: 3, label: 'Temario' },
  { id: 4, label: 'Ajustes' },
]

/**
 * Prefilled so a teacher who just wants the topics can save without writing
 * pedagogy prose. These feed the AI prompt (pedagogyProfileToContext), so a
 * sensible default beats an empty string.
 */
const DEFAULT_PEDAGOGY: PedagogyProfile = {
  level: '',
  degree: '',
  academicYear: '',
  complexity: 'Intermedia',
  assessmentStyle: 'mixto',
  methodology: 'Práctica guiada con ejercicios resueltos paso a paso y consignas de dificultad creciente.',
}

const COMPLEXITY_OPTIONS = ['Básica', 'Intermedia', 'Avanzada']

const ASSESSMENT_OPTIONS: { value: PedagogyProfile['assessmentStyle']; label: string }[] = [
  { value: 'teorico', label: 'Teórico' },
  { value: 'practico', label: 'Práctico' },
  { value: 'mixto', label: 'Mixto' },
]

function normalizeTopicKey(name: string): string {
  return name.trim().toLowerCase()
}

export function TeacherSubjectWizard({
  open,
  onOpenChange,
  onProgramCreated,
  onProgramUpdated,
  programToEdit = null,
}: TeacherSubjectWizardProps) {
  const { toast } = useToast()
  const isEditing = Boolean(programToEdit)

  // Monotonic counter for generated ids — stable within a wizard session and
  // collision-free even when several units are added in the same millisecond.
  const idCounter = useRef(0)
  const nextId = useCallback((prefix: string) => {
    idCounter.current += 1
    return `${prefix}-${idCounter.current}`
  }, [])

  const [step, setStep] = useState<StepId>(1)

  const [nivel, setNivel] = useState<Nivel | null>(null)
  const [grado, setGrado] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [iconName, setIconName] = useState<SubjectIconName>('book-open')
  const [colorName, setColorName] = useState<SubjectColorName>('teal')
  const [units, setUnits] = useState<ProgramUnit[]>([])
  const [pedagogy, setPedagogy] = useState<PedagogyProfile>(DEFAULT_PEDAGOGY)
  const [sourceMeta, setSourceMeta] = useState<ProgramSourceMeta | null>(null)

  const [grades, setGrades] = useState<string[]>([])
  const [isLoadingGrades, setIsLoadingGrades] = useState(false)
  const [curriculumSubjects, setCurriculumSubjects] = useState<string[]>([])
  const [browseMateria, setBrowseMateria] = useState('')
  const [axes, setAxes] = useState<CurriculumAxis[]>([])
  const [isLoadingAxes, setIsLoadingAxes] = useState(false)
  const [collapsedAxes, setCollapsedAxes] = useState<string[]>([])
  const [topicSearch, setTopicSearch] = useState('')

  const [activeUnitId, setActiveUnitId] = useState<string | null>(null)
  const [customTopicDraft, setCustomTopicDraft] = useState<Record<string, string>>({})
  const [showFileImport, setShowFileImport] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // ─── Load / reset when the dialog opens ────────────────────────────────────
  useEffect(() => {
    if (!open) return

    idCounter.current = 0

    if (programToEdit) {
      setNivel(programToEdit.nivel ?? null)
      setGrado(programToEdit.grado ?? '')
      setSubjectName(programToEdit.subjectName)
      setIconName(programToEdit.iconName)
      setColorName(programToEdit.colorName)
      setUnits(Array.isArray(programToEdit.units) ? programToEdit.units : [])
      setPedagogy({ ...DEFAULT_PEDAGOGY, ...programToEdit.pedagogyProfile })
      // Programs from before migration 014 have no nivel/grado: start on step 1
      // so the teacher fills the gap, otherwise jump straight to the topics.
      setStep(programToEdit.nivel && programToEdit.grado ? 3 : 1)
      setBrowseMateria(programToEdit.subjectName)
    } else {
      setNivel(null)
      setGrado('')
      setSubjectName('')
      setIconName('book-open')
      setColorName('teal')
      setUnits([])
      setPedagogy(DEFAULT_PEDAGOGY)
      setStep(1)
      setBrowseMateria('')
    }

    setSourceMeta(null)
    setActiveUnitId(null)
    setCustomTopicDraft({})
    setShowFileImport(false)
    setTopicSearch('')
    setCollapsedAxes([])
  }, [open, programToEdit])

  // ─── Curriculum lookups ────────────────────────────────────────────────────
  useEffect(() => {
    if (!open || !nivel) {
      setGrades([])
      return
    }

    let isMounted = true
    setIsLoadingGrades(true)

    fetch(`/api/curriculum/grades?nivel=${encodeURIComponent(nivel)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return
        setGrades(Array.isArray(data.grades) ? data.grades : [])
      })
      .catch(() => {
        if (isMounted) setGrades([])
      })
      .finally(() => {
        if (isMounted) setIsLoadingGrades(false)
      })

    return () => {
      isMounted = false
    }
  }, [open, nivel])

  useEffect(() => {
    if (!open || !nivel || !grado) {
      setCurriculumSubjects([])
      return
    }

    let isMounted = true

    fetch(`/api/curriculum/subjects?nivel=${encodeURIComponent(nivel)}&grado=${encodeURIComponent(grado)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return
        setCurriculumSubjects(Array.isArray(data.subjects) ? data.subjects : [])
      })
      .catch(() => {
        if (isMounted) setCurriculumSubjects([])
      })

    return () => {
      isMounted = false
    }
  }, [open, nivel, grado])

  useEffect(() => {
    if (!open || !nivel || !grado || !browseMateria) {
      setAxes([])
      return
    }

    let isMounted = true
    setIsLoadingAxes(true)

    const query = new URLSearchParams({ nivel, grado, materia: browseMateria })

    fetch(`/api/curriculum/topics?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return
        setAxes(Array.isArray(data.axes) ? data.axes : [])
      })
      .catch(() => {
        if (isMounted) setAxes([])
      })
      .finally(() => {
        if (isMounted) setIsLoadingAxes(false)
      })

    return () => {
      isMounted = false
    }
  }, [open, nivel, grado, browseMateria])

  // When the curriculum offers exactly the subject the teacher named, browse it
  // by default so step 3 opens with topics already on screen.
  useEffect(() => {
    if (browseMateria || curriculumSubjects.length === 0) return

    const match = curriculumSubjects.find(
      (materia) => normalizeTopicKey(materia) === normalizeTopicKey(subjectName)
    )
    if (match) setBrowseMateria(match)
  }, [curriculumSubjects, subjectName, browseMateria])

  // ─── Unit / topic editing ──────────────────────────────────────────────────
  const addedTopicKeys = useMemo(() => {
    const keys = new Set<string>()
    units.forEach((unit) => unit.topics.forEach((topic) => keys.add(normalizeTopicKey(topic.name))))
    return keys
  }, [units])

  const addCurriculumTopic = (temaName: string, eje: string) => {
    if (addedTopicKeys.has(normalizeTopicKey(temaName))) return

    const topic = { id: nextId('t'), name: temaName, origin: 'curriculum' as const, sourceEje: eje }

    // No units yet: the first pick creates the unit it lands in.
    if (units.length === 0) {
      const created: ProgramUnit = { id: nextId('u'), name: 'Unidad 1', topics: [topic] }
      setUnits([created])
      setActiveUnitId(created.id)
      return
    }

    const targetId = units.some((unit) => unit.id === activeUnitId) ? activeUnitId : units[0].id
    setUnits((prev) =>
      prev.map((unit) => (unit.id === targetId ? { ...unit, topics: [...unit.topics, topic] } : unit))
    )
  }

  const addAxisAsUnit = (axis: CurriculumAxis) => {
    const pending = axis.temas.filter((tema) => !addedTopicKeys.has(normalizeTopicKey(tema)))

    if (pending.length === 0) {
      toast({ title: 'Sin temas nuevos', description: `Ya agregaste todos los temas de "${axis.eje}".` })
      return
    }

    const created: ProgramUnit = {
      id: nextId('u'),
      name: axis.eje,
      topics: pending.map((tema) => ({
        id: nextId('t'),
        name: tema,
        origin: 'curriculum' as const,
        sourceEje: axis.eje,
      })),
    }

    setUnits((prev) => [...prev, created])
    setActiveUnitId(created.id)
  }

  const addEmptyUnit = () => {
    const created: ProgramUnit = { id: nextId('u'), name: '', topics: [] }
    setUnits((prev) => [...prev, created])
    setActiveUnitId(created.id)
  }

  const renameUnit = (unitId: string, name: string) => {
    setUnits((prev) => prev.map((unit) => (unit.id === unitId ? { ...unit, name } : unit)))
  }

  const removeUnit = (unitId: string) => {
    setUnits((prev) => prev.filter((unit) => unit.id !== unitId))
    setActiveUnitId((prev) => (prev === unitId ? null : prev))
  }

  const moveUnit = (unitId: string, direction: -1 | 1) => {
    setUnits((prev) => {
      const index = prev.findIndex((unit) => unit.id === unitId)
      const target = index + direction
      if (index < 0 || target < 0 || target >= prev.length) return prev

      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const removeTopic = (unitId: string, topicId: string) => {
    setUnits((prev) =>
      prev.map((unit) =>
        unit.id === unitId ? { ...unit, topics: unit.topics.filter((topic) => topic.id !== topicId) } : unit
      )
    )
  }

  const addCustomTopic = (unitId: string) => {
    const name = (customTopicDraft[unitId] ?? '').trim()
    if (!name) return

    if (addedTopicKeys.has(normalizeTopicKey(name))) {
      toast({ title: 'Tema repetido', description: `"${name}" ya está en tu temario.` })
      return
    }

    setUnits((prev) =>
      prev.map((unit) =>
        unit.id === unitId
          ? { ...unit, topics: [...unit.topics, { id: nextId('t'), name, origin: 'custom' as const }] }
          : unit
      )
    )
    setCustomTopicDraft((prev) => ({ ...prev, [unitId]: '' }))
  }

  /**
   * Units coming from a document are merged, never substituted: by the time a
   * teacher imports a file they may already have curated topics by hand.
   */
  const mergeSuggestedUnits = (suggested: ProgramUnit[], anchorUnitName?: string) => {
    const rekeyed = suggested.map((unit) => ({
      id: nextId('u'),
      name: unit.name,
      topics: unit.topics
        .filter((topic) => !addedTopicKeys.has(normalizeTopicKey(topic.name)))
        .map((topic) => ({ id: nextId('t'), name: topic.name, origin: 'custom' as const })),
    }))

    setUnits((prev) => {
      if (!anchorUnitName) return [...prev, ...rekeyed]

      const anchorIndex = prev.findIndex(
        (unit) => normalizeTopicKey(unit.name) === normalizeTopicKey(anchorUnitName)
      )
      if (anchorIndex < 0) return [...prev, ...rekeyed]

      return [...prev.slice(0, anchorIndex + 1), ...rekeyed, ...prev.slice(anchorIndex + 1)]
    })
  }

  // ─── Step validation ───────────────────────────────────────────────────────
  const stepBlockers: Record<StepId, string | null> = useMemo(() => {
    const cleanUnits = units.filter((unit) => unit.name.trim() && unit.topics.length > 0)

    return {
      1: !nivel ? 'Elegí un nivel.' : !grado.trim() ? 'Elegí el año o grado.' : null,
      2: !subjectName.trim() ? 'Escribí el nombre de la materia.' : null,
      3:
        cleanUnits.length === 0
          ? 'Armá al menos una unidad con nombre y un tema adentro.'
          : units.some((unit) => !unit.name.trim())
            ? 'Hay unidades sin nombre.'
            : units.some((unit) => unit.topics.length === 0)
              ? 'Hay unidades sin temas.'
              : null,
      4:
        nivel === 'Superior' && !pedagogy.degree.trim()
          ? 'Indicá la carrera.'
          : !pedagogy.complexity.trim()
            ? 'Elegí la complejidad.'
            : !pedagogy.methodology.trim()
              ? 'Describí brevemente la metodología.'
              : null,
    }
  }, [nivel, grado, subjectName, units, pedagogy])

  const canReachStep = (target: StepId): boolean => {
    for (let id = 1; id < target; id += 1) {
      if (stepBlockers[id as StepId]) return false
    }
    return true
  }

  const goToStep = (target: StepId) => {
    if (!canReachStep(target)) {
      toast({ title: 'Falta completar un paso', description: stepBlockers[step] ?? 'Revisá los pasos anteriores.' })
      return
    }
    setStep(target)
  }

  // ─── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const blocker = ([1, 2, 3, 4] as StepId[]).map((id) => stepBlockers[id]).find(Boolean)
    if (blocker) {
      toast({ title: 'No se puede guardar todavía', description: blocker })
      return
    }

    setIsSaving(true)

    const cleanUnits: ProgramUnit[] = units
      .map((unit) => ({
        id: unit.id,
        name: unit.name.trim(),
        topics: unit.topics
          .map((topic) => ({ ...topic, name: topic.name.trim() }))
          .filter((topic) => topic.name.length > 0),
      }))
      .filter((unit) => unit.name.length > 0 && unit.topics.length > 0)

    const usesCurriculum = cleanUnits.some((unit) => unit.topics.some((topic) => topic.origin === 'curriculum'))
    const createdFrom: ProgramCreatedFrom = usesCurriculum ? 'curriculum' : sourceMeta ? 'upload' : 'manual'

    try {
      const response = await fetch(
        isEditing ? `/api/teacher/programs/${programToEdit?.id}` : '/api/teacher/programs',
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjectName: subjectName.trim(),
            iconName,
            colorName,
            nivel,
            grado: grado.trim(),
            jurisdiccion: DEFAULT_JURISDICTION,
            createdFrom,
            pedagogyProfile: {
              ...pedagogy,
              level: nivel ?? pedagogy.level,
              academicYear: grado.trim() || pedagogy.academicYear,
            },
            units: cleanUnits,
            sourceFileName: sourceMeta?.sourceFileName ?? null,
            sourceMimeType: sourceMeta?.sourceMimeType ?? null,
            sourceFileSizeBytes: sourceMeta?.sourceFileSizeBytes ?? null,
          }),
        }
      )

      const data = await response.json()
      if (!response.ok) {
        const detailMessage = data?.details ? ` (${data.details})` : ''
        throw new Error(`${data.error || 'No se pudo guardar la materia'}${detailMessage}`)
      }

      const saved = data.program
      const normalizedProgram: TeacherProgram = {
        id: Number(saved.id),
        userId: saved.user_id,
        subjectName: saved.subject_name,
        iconName: saved.icon_name || iconName,
        colorName: saved.color_name || colorName,
        pedagogyProfile: saved.pedagogy_profile,
        units: saved.units,
        sourceFileName: saved.source_file_name ?? null,
        createdAt: saved.created_at,
        nivel: (saved.nivel ?? nivel) as Nivel | null,
        grado: saved.grado ?? grado.trim(),
        jurisdiccion: saved.jurisdiccion ?? DEFAULT_JURISDICTION,
        createdFrom: (saved.created_from ?? createdFrom) as ProgramCreatedFrom,
      }

      if (isEditing && onProgramUpdated) {
        onProgramUpdated(normalizedProgram)
      } else {
        onProgramCreated(normalizedProgram)
      }

      toast({
        title: isEditing ? 'Materia actualizada' : 'Materia creada',
        description: `${normalizedProgram.subjectName} · ${cleanUnits.length} unidades listas para generar cuestionarios.`,
      })
      onOpenChange(false)
    } catch (error) {
      toast({ title: 'Error al guardar', description: error instanceof Error ? error.message : 'Error desconocido' })
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Render helpers ────────────────────────────────────────────────────────
  const SelectedIcon = SUBJECT_ICON_COMPONENTS[iconName]
  const topicCount = units.reduce((total, unit) => total + unit.topics.length, 0)

  const filteredAxes = useMemo(() => {
    const query = normalizeTopicKey(topicSearch)
    if (!query) return axes

    return axes
      .map((axis) => ({ ...axis, temas: axis.temas.filter((tema) => normalizeTopicKey(tema).includes(query)) }))
      .filter((axis) => axis.temas.length > 0 || normalizeTopicKey(axis.eje).includes(query))
  }, [axes, topicSearch])

  const renderStepOne = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Nivel educativo</Label>
        <div className="grid sm:grid-cols-3 gap-3">
          {NIVEL_OPTIONS.map((option) => {
            const isActive = nivel === option.value
            const Icon = option.Icon
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setNivel(option.value)
                  setGrado('')
                  setBrowseMateria('')
                }}
                className={`text-left p-4 rounded-xl border-2 transition-all ${isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40'}`}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${option.color} text-white flex items-center justify-center mb-2`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-semibold text-sm">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.sub}</p>
              </button>
            )
          })}
        </div>
      </div>

      {nivel && (
        <div className="space-y-2">
          <Label>Año / grado</Label>
          {isLoadingGrades && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Buscando años de {nivel}...
            </p>
          )}

          {!isLoadingGrades && grades.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {grades.map((option) => (
                <Button
                  key={option}
                  type="button"
                  size="sm"
                  variant={grado === option ? 'default' : 'outline'}
                  onClick={() => {
                    setGrado(option)
                    setBrowseMateria('')
                  }}
                >
                  {option}
                </Button>
              ))}
            </div>
          )}

          {!isLoadingGrades && grades.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay años cargados en el diseño curricular de {DEFAULT_JURISDICTION} para este nivel. Escribilo a mano y
              después armá el temario con tus propios temas.
            </p>
          )}

          <div className="space-y-1 pt-1">
            <Label className="text-xs text-muted-foreground">
              {grades.length > 0 ? 'O escribilo si no está en la lista' : 'Año o grado'}
            </Label>
            <Input
              placeholder="Ej: 3er Año"
              value={grado}
              onChange={(event) => setGrado(event.target.value)}
              className="max-w-xs"
            />
          </div>
        </div>
      )}
    </div>
  )

  const renderStepTwo = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="wizard-subject-name">Nombre de la materia</Label>
        <Input
          id="wizard-subject-name"
          placeholder="Ej: Matemática"
          value={subjectName}
          onChange={(event) => setSubjectName(event.target.value)}
        />

        {curriculumSubjects.length > 0 && (
          <div className="space-y-2 pt-1">
            <p className="text-xs text-muted-foreground">
              Materias del diseño curricular para {nivel} · {grado}. Elegí una para partir de su temario.
            </p>
            <div className="flex flex-wrap gap-2">
              {curriculumSubjects.map((materia) => (
                <Button
                  key={materia}
                  type="button"
                  size="sm"
                  variant={normalizeTopicKey(subjectName) === normalizeTopicKey(materia) ? 'default' : 'outline'}
                  onClick={() => {
                    setSubjectName(materia)
                    setBrowseMateria(materia)
                  }}
                >
                  {materia}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Ícono</Label>
          <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
            <div className="w-8 h-8 rounded-md border flex items-center justify-center bg-muted">
              <SelectedIcon className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">{iconName}</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {SUBJECT_ICON_OPTIONS.map((icon) => {
              const Icon = SUBJECT_ICON_COMPONENTS[icon]
              return (
                <Button
                  key={icon}
                  type="button"
                  variant={iconName === icon ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIconName(icon)}
                  className="h-10 px-2"
                  title={icon}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Color</Label>
          <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
            <span className={`w-4 h-4 rounded-full border ${SUBJECT_COLOR_CLASS[colorName].chip}`} />
            <span className="text-sm font-medium">{colorName}</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {SUBJECT_COLOR_OPTIONS.map((color) => (
              <Button
                key={color}
                type="button"
                variant={colorName === color ? 'default' : 'outline'}
                size="sm"
                onClick={() => setColorName(color)}
                className="h-10 px-2"
                title={color}
              >
                <span className={`w-4 h-4 rounded-full border ${SUBJECT_COLOR_CLASS[color].chip}`} />
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderCurriculumPanel = () => (
    <Card className="p-4 space-y-3 flex flex-col min-h-0">
      <div>
        <h3 className="font-semibold text-sm">Diseño curricular</h3>
        <p className="text-xs text-muted-foreground">
          {nivel} · {grado} · {DEFAULT_JURISDICTION}
        </p>
      </div>

      {curriculumSubjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {curriculumSubjects.map((materia) => (
            <Button
              key={materia}
              type="button"
              size="sm"
              variant={browseMateria === materia ? 'default' : 'outline'}
              className="h-7 text-xs"
              onClick={() => setBrowseMateria(materia)}
            >
              {materia}
            </Button>
          ))}
        </div>
      )}

      {curriculumSubjects.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No hay materias cargadas para {nivel} · {grado}. Podés armar el temario con tus propios temas en el panel de
          la derecha o importarlo desde un archivo.
        </p>
      )}

      {browseMateria && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar tema..."
            value={topicSearch}
            onChange={(event) => setTopicSearch(event.target.value)}
            className="pl-8 h-9"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 min-h-0 max-h-[46vh] pr-1">
        {isLoadingAxes && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando temas...
          </p>
        )}

        {!isLoadingAxes && browseMateria && filteredAxes.length === 0 && (
          <p className="text-sm text-muted-foreground">No se encontraron temas para esa búsqueda.</p>
        )}

        {!isLoadingAxes &&
          filteredAxes.map((axis) => {
            const isCollapsed = collapsedAxes.includes(axis.eje)
            const pendingCount = axis.temas.filter((tema) => !addedTopicKeys.has(normalizeTopicKey(tema))).length

            return (
              <div key={axis.eje} className="border rounded-lg overflow-hidden">
                <div className="flex items-center gap-1 bg-muted/50 px-2 py-1.5">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
                    onClick={() =>
                      setCollapsedAxes((prev) =>
                        prev.includes(axis.eje) ? prev.filter((item) => item !== axis.eje) : [...prev, axis.eje]
                      )
                    }
                  >
                    {isCollapsed ? <ChevronRight className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                    <span className="text-xs font-semibold truncate">{axis.eje}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0">({axis.temas.length})</span>
                  </button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[11px] px-2 shrink-0"
                    onClick={() => addAxisAsUnit(axis)}
                    disabled={pendingCount === 0}
                    title={`Crear una unidad con todos los temas de ${axis.eje}`}
                    aria-label={`Crear una unidad con todos los temas de ${axis.eje}`}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Todo el eje
                  </Button>
                </div>

                {!isCollapsed && (
                  <ul className="divide-y">
                    {axis.temas.map((tema) => {
                      const isAdded = addedTopicKeys.has(normalizeTopicKey(tema))
                      return (
                        <li key={tema} className="flex items-center gap-2 px-2 py-1.5">
                          <span className={`text-xs flex-1 ${isAdded ? 'text-muted-foreground line-through' : ''}`}>
                            {tema}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant={isAdded ? 'ghost' : 'outline'}
                            className="h-7 px-2 shrink-0"
                            disabled={isAdded}
                            onClick={() => addCurriculumTopic(tema, axis.eje)}
                            aria-label={isAdded ? `${tema} ya está en tu temario` : `Agregar ${tema}`}
                          >
                            {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          </Button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
      </div>
    </Card>
  )

  const renderUnitsPanel = () => (
    <Card className="p-4 space-y-3 flex flex-col min-h-0">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-sm">Tu temario</h3>
          <p className="text-xs text-muted-foreground">
            {units.length} unidades · {topicCount} temas
          </p>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={addEmptyUnit}>
          <Plus className="w-4 h-4 mr-1" />
          Unidad
        </Button>
      </div>

      {units.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Creá una unidad y después agregá temas desde el diseño curricular o escribí los tuyos.
        </p>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 min-h-0 max-h-[46vh] pr-1">
        {units.map((unit, unitIndex) => {
          const isActive = activeUnitId === unit.id || (!activeUnitId && unitIndex === 0)

          return (
            <div
              key={unit.id}
              className={`rounded-lg border-2 p-2.5 space-y-2 transition-colors ${isActive ? 'border-primary bg-primary/5' : 'border-border'}`}
              onClick={() => setActiveUnitId(unit.id)}
            >
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{unitIndex + 1}.</span>
                <Input
                  placeholder="Nombre de la unidad"
                  value={unit.name}
                  onChange={(event) => renameUnit(unit.id, event.target.value)}
                  className="h-8 text-sm"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-7 shrink-0"
                  onClick={(event) => {
                    event.stopPropagation()
                    moveUnit(unit.id, -1)
                  }}
                  disabled={unitIndex === 0}
                  aria-label="Subir unidad"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-7 shrink-0"
                  onClick={(event) => {
                    event.stopPropagation()
                    moveUnit(unit.id, 1)
                  }}
                  disabled={unitIndex === units.length - 1}
                  aria-label="Bajar unidad"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-7 shrink-0 text-destructive"
                  onClick={(event) => {
                    event.stopPropagation()
                    removeUnit(unit.id)
                  }}
                  aria-label="Eliminar unidad"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              {unit.topics.length === 0 && (
                <p className="text-[11px] text-muted-foreground pl-6">
                  {isActive ? 'Los temas que agregues caen en esta unidad.' : 'Sin temas.'}
                </p>
              )}

              <ul className="space-y-1 pl-6">
                {unit.topics.map((topic) => (
                  <li key={topic.id} className="flex items-center gap-1.5">
                    <span className="text-xs flex-1">{topic.name}</span>
                    {topic.origin === 'curriculum' ? (
                      <Badge variant="secondary" className="h-5 text-[10px] px-1.5 shrink-0" title={topic.sourceEje}>
                        Currículum
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="h-5 text-[10px] px-1.5 shrink-0">
                        Propio
                      </Badge>
                    )}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0"
                      onClick={() => removeTopic(unit.id, topic.id)}
                      aria-label={`Quitar ${topic.name}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-1.5 pl-6">
                <Input
                  placeholder="Escribí un tema propio"
                  value={customTopicDraft[unit.id] ?? ''}
                  onChange={(event) => setCustomTopicDraft((prev) => ({ ...prev, [unit.id]: event.target.value }))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addCustomTopic(unit.id)
                    }
                  }}
                  className="h-8 text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 shrink-0"
                  onClick={() => addCustomTopic(unit.id)}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowFileImport((prev) => !prev)}>
          <Upload className="w-4 h-4 mr-2" />
          {showFileImport ? 'Ocultar importación desde archivo' : 'Importar desde un archivo (PDF, Word)'}
        </Button>
        {showFileImport && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground pb-2">
              Las unidades que encuentre la IA se agregan a tu temario, no lo reemplazan.
            </p>
            <ProgramFileImport onUnitsSuggested={mergeSuggestedUnits} onSourceMetaChange={setSourceMeta} />
          </div>
        )}
      </div>
    </Card>
  )

  const renderStepFour = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Estos datos no los ve el alumno: orientan a la IA cuando genera los cuestionarios de la materia.
      </p>

      {nivel === 'Superior' && (
        <div className="space-y-1">
          <Label>Carrera</Label>
          <Input
            placeholder="Ej: Profesorado en Matemática"
            value={pedagogy.degree}
            onChange={(event) => setPedagogy((prev) => ({ ...prev, degree: event.target.value }))}
          />
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Complejidad</Label>
          <div className="flex flex-wrap gap-2">
            {COMPLEXITY_OPTIONS.map((option) => (
              <Button
                key={option}
                type="button"
                size="sm"
                variant={pedagogy.complexity === option ? 'default' : 'outline'}
                onClick={() => setPedagogy((prev) => ({ ...prev, complexity: option }))}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Label>Enfoque</Label>
          <div className="flex flex-wrap gap-2">
            {ASSESSMENT_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={pedagogy.assessmentStyle === option.value ? 'default' : 'outline'}
                onClick={() => setPedagogy((prev) => ({ ...prev, assessmentStyle: option.value }))}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Metodología de enseñanza</Label>
        <Textarea
          rows={3}
          value={pedagogy.methodology}
          onChange={(event) => setPedagogy((prev) => ({ ...prev, methodology: event.target.value }))}
        />
      </div>

      <Card className="p-4 bg-muted/40 space-y-1">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Resumen
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>{subjectName}</strong> · {nivel} · {grado}
        </p>
        <p className="text-sm text-muted-foreground">
          {units.length} unidades y {topicCount} temas.
        </p>
      </Card>
    </div>
  )

  const currentBlocker = stepBlockers[step]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar materia' : 'Crear materia'}</DialogTitle>
          <DialogDescription>
            Elegí nivel y año, y armá el temario tomando temas del diseño curricular o escribiendo los tuyos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-1.5 pb-1">
          {STEPS.map((item, index) => {
            const isCurrent = step === item.id
            const isDone = step > item.id && !stepBlockers[item.id]

            return (
              <div key={item.id} className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => goToStep(item.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    isCurrent
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isDone
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-background/20 flex items-center justify-center text-[10px]">
                    {isDone ? <Check className="w-3 h-3" /> : item.id}
                  </span>
                  {item.label}
                </button>
                {index < STEPS.length - 1 && <span className="text-muted-foreground text-xs">›</span>}
              </div>
            )
          })}
        </div>

        <div className="py-1">
          {step === 1 && renderStepOne()}
          {step === 2 && renderStepTwo()}
          {step === 3 && (
            <div className="grid lg:grid-cols-2 gap-4">
              {renderCurriculumPanel()}
              {renderUnitsPanel()}
            </div>
          )}
          {step === 4 && renderStepFour()}
        </div>

        {currentBlocker && <p className="text-sm text-amber-700">{currentBlocker}</p>}

        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => (step === 1 ? onOpenChange(false) : setStep((prev) => (prev - 1) as StepId))}
          >
            {step === 1 ? 'Cancelar' : 'Atrás'}
          </Button>

          {step < 4 ? (
            <Button type="button" onClick={() => goToStep((step + 1) as StepId)} disabled={Boolean(currentBlocker)}>
              Continuar
            </Button>
          ) : (
            <Button type="button" onClick={handleSave} disabled={isSaving || Boolean(currentBlocker)}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isEditing ? 'Guardar cambios' : 'Crear materia'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
