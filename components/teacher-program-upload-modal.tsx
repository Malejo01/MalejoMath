'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  Atom,
  BookOpen,
  Calculator,
  ChartLine,
  FlaskConical,
  Landmark,
  Loader2,
  PieChart,
  Plus,
  Ruler,
  Sigma,
  Target,
  Trash2,
  Upload,
} from 'lucide-react'
import type { PedagogyProfile, ProgramUnit, SubjectColorName, SubjectIconName, TeacherProgram } from '@/lib/types'
import { SUBJECT_COLOR_OPTIONS, SUBJECT_ICON_OPTIONS } from '@/lib/subject-appearance'

interface TeacherProgramUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProgramCreated: (program: TeacherProgram) => void
  onProgramUpdated?: (program: TeacherProgram) => void
  programToEdit?: TeacherProgram | null
}

const defaultPedagogy: PedagogyProfile = {
  level: '',
  degree: '',
  academicYear: '',
  complexity: '',
  assessmentStyle: 'mixto',
  methodology: '',
}

const iconMap = {
  'book-open': BookOpen,
  calculator: Calculator,
  sigma: Sigma,
  'chart-line': ChartLine,
  'flask-conical': FlaskConical,
  atom: Atom,
  ruler: Ruler,
  landmark: Landmark,
  'pie-chart': PieChart,
  target: Target,
}

const colorSwatchClass: Record<SubjectColorName, string> = {
  teal: 'bg-teal-500',
  blue: 'bg-blue-500',
  orange: 'bg-orange-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  indigo: 'bg-indigo-500',
  amber: 'bg-amber-500',
  cyan: 'bg-cyan-500',
  emerald: 'bg-emerald-500',
  pink: 'bg-pink-500',
}

function createInitialUnits(): ProgramUnit[] {
  return [
    {
      id: 'unit-1',
      name: '',
      topics: [
        {
          id: 'unit-1-topic-1',
          name: '',
        },
      ],
    },
  ]
}

function sanitizeUnits(input: unknown): ProgramUnit[] {
  if (!Array.isArray(input)) {
    return createInitialUnits()
  }

  const sanitized = input
    .map((unit, unitIndex) => {
      const safeTopics = Array.isArray((unit as ProgramUnit).topics) ? (unit as ProgramUnit).topics : []
      return {
        id: String((unit as ProgramUnit).id || `tp-u-${unitIndex + 1}`),
        name: String((unit as ProgramUnit).name || `Unidad ${unitIndex + 1}`),
        topics: safeTopics
          .map((topic, topicIndex) => ({
            id: String(topic.id || `tp-u-${unitIndex + 1}-t-${topicIndex + 1}`),
            name: String(topic.name || `Tema ${topicIndex + 1}`),
          }))
          .filter((topic) => topic.name.trim().length > 0),
      }
    })
    .filter((unit) => unit.name.trim().length > 0 && unit.topics.length > 0)

  return sanitized.length > 0 ? sanitized : createInitialUnits()
}

export function TeacherProgramUploadModal({
  open,
  onOpenChange,
  onProgramCreated,
  onProgramUpdated,
  programToEdit = null,
}: TeacherProgramUploadModalProps) {
  const { toast } = useToast()
  const [subjectName, setSubjectName] = useState('')
  const [iconName, setIconName] = useState<SubjectIconName>('book-open')
  const [colorName, setColorName] = useState<SubjectColorName>('teal')
  const [pedagogyProfile, setPedagogyProfile] = useState<PedagogyProfile>(defaultPedagogy)
  const [units, setUnits] = useState<ProgramUnit[]>(createInitialUnits())
  const [file, setFile] = useState<File | null>(null)
  const [sourceMeta, setSourceMeta] = useState<{
    sourceFileName: string
    sourceMimeType: string
    sourceFileSizeBytes: number
  } | null>(null)
  const [extractSummary, setExtractSummary] = useState<{
    extractionMethod: 'ai' | 'heuristic'
    extractionConfidence: number
    lowConfidence: boolean
    unitCount: number
    topicCount: number
  } | null>(null)
  const [extractStage, setExtractStage] = useState('Listo para procesar')
  const [extractProgress, setExtractProgress] = useState(0)
  const [isExtracting, setIsExtracting] = useState(false)
  const [hasExtractRun, setHasExtractRun] = useState(false)
  const [showGuidePanel, setShowGuidePanel] = useState(false)
  const [guideUnitName, setGuideUnitName] = useState('')
  const [guideTopicOne, setGuideTopicOne] = useState('')
  const [guideTopicTwo, setGuideTopicTwo] = useState('')
  const [guideRejectedUnits, setGuideRejectedUnits] = useState<string[]>([])
  const [guideRejectedTopics, setGuideRejectedTopics] = useState<string[]>([])
  const [guideFeedbackNote, setGuideFeedbackNote] = useState('')
  const [guideRetryCount, setGuideRetryCount] = useState(0)
  const [isGuiding, setIsGuiding] = useState(false)
  const [guidePreviewUnits, setGuidePreviewUnits] = useState<ProgramUnit[] | null>(null)
  const [guideSummary, setGuideSummary] = useState<{
    extractionMethod: 'ai' | 'heuristic'
    strategy: 'semantic' | 'numbering' | 'hybrid'
    guideConfidence: number
    lowConfidence: boolean
    unitCount: number
    topicCount: number
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const SelectedIconComponent = iconMap[iconName]

  const isPedagogyValid = useMemo(() => {
    return Boolean(
      pedagogyProfile.level.trim() &&
        pedagogyProfile.degree.trim() &&
        pedagogyProfile.academicYear.trim() &&
        pedagogyProfile.complexity.trim() &&
        pedagogyProfile.assessmentStyle.trim() &&
        pedagogyProfile.methodology.trim()
    )
  }, [pedagogyProfile])

  const hasValidStructure = useMemo(() => {
    if (!units.length) return false

    return units.every((unit) => {
      if (!unit.name.trim() || !unit.topics.length) return false
      return unit.topics.every((topic) => topic.name.trim().length > 0)
    })
  }, [units])

  const saveBlockerMessage = useMemo(() => {
    if (!subjectName.trim()) return 'Completa el nombre de la materia.'
    if (!isPedagogyValid) return 'Completa todos los datos pedagogicos obligatorios.'
    if (!hasValidStructure) return 'Revisa la estructura: cada unidad debe tener al menos un tema con nombre.'
    return null
  }, [subjectName, isPedagogyValid, hasValidStructure])

  const canSave = !isSaving && !saveBlockerMessage
  const isEditing = Boolean(programToEdit)

  const resetForm = () => {
    setSubjectName('')
    setIconName('book-open')
    setColorName('teal')
    setPedagogyProfile(defaultPedagogy)
    setUnits(createInitialUnits())
    setFile(null)
    setSourceMeta(null)
    setExtractSummary(null)
    setExtractStage('Listo para procesar')
    setExtractProgress(0)
    setHasExtractRun(false)
    setShowGuidePanel(false)
    setGuideUnitName('')
    setGuideTopicOne('')
    setGuideTopicTwo('')
    setGuideRejectedUnits([])
    setGuideRejectedTopics([])
    setGuideFeedbackNote('')
    setGuideRetryCount(0)
    setIsGuiding(false)
    setGuidePreviewUnits(null)
    setGuideSummary(null)
  }

  useEffect(() => {
    if (!open) return

    if (programToEdit) {
      setSubjectName(programToEdit.subjectName)
      setIconName(programToEdit.iconName)
      setColorName(programToEdit.colorName)
      setPedagogyProfile(programToEdit.pedagogyProfile)
      setUnits(sanitizeUnits(programToEdit.units))
      setFile(null)
      setSourceMeta(null)
      setExtractSummary(null)
      setExtractStage('Listo para procesar')
      setExtractProgress(0)
      setHasExtractRun(false)
      setShowGuidePanel(false)
      setGuideUnitName('')
      setGuideTopicOne('')
      setGuideTopicTwo('')
      setGuideRejectedUnits([])
      setGuideRejectedTopics([])
      setGuideFeedbackNote('')
      setGuideRetryCount(0)
      setIsGuiding(false)
      setGuidePreviewUnits(null)
      setGuideSummary(null)
      return
    }

    resetForm()
  }, [open, programToEdit])

  const updateUnitName = (unitIndex: number, value: string) => {
    setUnits((prev) => prev.map((unit, index) => (index === unitIndex ? { ...unit, name: value } : unit)))
  }

  const updateTopicName = (unitIndex: number, topicIndex: number, value: string) => {
    setUnits((prev) =>
      prev.map((unit, uIndex) => {
        if (uIndex !== unitIndex) return unit
        return {
          ...unit,
          topics: unit.topics.map((topic, tIndex) => (tIndex === topicIndex ? { ...topic, name: value } : topic)),
        }
      })
    )
  }

  const addUnit = () => {
    const seed = Date.now()
    setUnits((prev) => [
      ...prev,
      {
        id: `unit-${seed}`,
        name: '',
        topics: [
          {
            id: `unit-${seed}-topic-1`,
            name: '',
          },
        ],
      },
    ])
  }

  const addTopic = (unitIndex: number) => {
    setUnits((prev) =>
      prev.map((unit, index) => {
        if (index !== unitIndex) return unit

        return {
          ...unit,
          topics: [
            ...unit.topics,
            {
              id: `${unit.id}-topic-${unit.topics.length + 1}`,
              name: '',
            },
          ],
        }
      })
    )
  }

  const removeUnit = (unitIndex: number) => {
    setUnits((prev) => prev.filter((_, index) => index !== unitIndex))
  }

  const removeTopic = (unitIndex: number, topicIndex: number) => {
    setUnits((prev) =>
      prev.map((unit, index) => {
        if (index !== unitIndex) return unit
        return { ...unit, topics: unit.topics.filter((_, tIndex) => tIndex !== topicIndex) }
      })
    )
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null)
    setSourceMeta(null)
    setExtractSummary(null)
    setHasExtractRun(false)
    setShowGuidePanel(false)
    setGuidePreviewUnits(null)
    setGuideSummary(null)
    setGuideRejectedUnits([])
    setGuideRejectedTopics([])
    setGuideFeedbackNote('')
    setGuideRetryCount(0)
    setGuideUnitName('')
    setGuideTopicOne('')
    setGuideTopicTwo('')
  }

  const toggleRejectedUnit = (name: string) => {
    const normalized = name.trim().toLowerCase()
    if (!normalized) return

    setGuideRejectedUnits((prev) =>
      prev.includes(normalized) ? prev.filter((item) => item !== normalized) : [...prev, normalized]
    )
  }

  const toggleRejectedTopic = (name: string) => {
    const normalized = name.trim().toLowerCase()
    if (!normalized) return

    setGuideRejectedTopics((prev) =>
      prev.includes(normalized) ? prev.filter((item) => item !== normalized) : [...prev, normalized]
    )
  }

  const isRejectedUnit = (name: string) => guideRejectedUnits.includes(name.trim().toLowerCase())
  const isRejectedTopic = (name: string) => guideRejectedTopics.includes(name.trim().toLowerCase())

  const handleGuideAutocomplete = async () => {
    if (!sourceMeta?.sourceFileName) {
      toast({ title: 'Falta archivo fuente', description: 'Vuelve a ejecutar Autocompletar con IA para habilitar el guiado.' })
      return
    }

    const seedTopics = [guideTopicOne, guideTopicTwo].map((value) => value.trim()).filter((value) => value.length > 0)

    if (!guideUnitName.trim() || seedTopics.length < 2) {
      toast({ title: 'Datos insuficientes', description: 'Para guiar, completa 1 unidad y al menos 2 temas.' })
      return
    }

    setIsGuiding(true)

    try {
      const response = await fetch('/api/teacher/programs/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceFileName: sourceMeta.sourceFileName,
          seedUnitName: guideUnitName.trim(),
          seedTopics,
          rejectedUnitNames: guideRejectedUnits,
          rejectedTopicNames: guideRejectedTopics,
          guidanceNote: guideFeedbackNote.trim() || undefined,
          retryCount: guideRetryCount,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        const detailMessage = data?.details ? ` (${typeof data.details === 'string' ? data.details : 'revisa el formato'})` : ''
        throw new Error(`${data?.error || 'No se pudo guiar el autocompletado'}${detailMessage}`)
      }

      const preview = sanitizeUnits(data.previewUnits)
      setGuidePreviewUnits(preview)
      setGuideSummary({
        extractionMethod: data.extractionMethod === 'heuristic' ? 'heuristic' : 'ai',
        strategy: data.strategy === 'numbering' || data.strategy === 'hybrid' ? data.strategy : 'semantic',
        guideConfidence: Number(data.guideConfidence || 0),
        lowConfidence: Boolean(data.lowConfidence),
        unitCount: Number(data?.summary?.unitCount || 0),
        topicCount: Number(data?.summary?.topicCount || 0),
      })
      setGuideRetryCount((prev) => prev + 1)

      toast({
        title: 'Vista previa generada',
        description: `${data?.summary?.unitCount || 0} unidades y ${data?.summary?.topicCount || 0} temas listos para revisar.`,
      })
    } catch (error) {
      toast({
        title: 'No se pudo guiar el autocompletado',
        description: error instanceof Error ? error.message : 'Error desconocido',
      })
    } finally {
      setIsGuiding(false)
    }
  }

  const handleApplyGuidePreview = () => {
    if (!guidePreviewUnits || guidePreviewUnits.length === 0) {
      toast({ title: 'Sin vista previa', description: 'Genera una vista previa antes de aplicar cambios.' })
      return
    }

    setUnits((prev) => {
      const safePrev = sanitizeUnits(prev)

      const anchorIndex = safePrev.findIndex(
        (unit) => unit.name.trim().toLowerCase() === guideUnitName.trim().toLowerCase()
      )
      if (anchorIndex >= 0) {
        return sanitizeUnits([...safePrev.slice(0, anchorIndex + 1), ...guidePreviewUnits])
      }

      return sanitizeUnits([...safePrev, ...guidePreviewUnits])
    })

    toast({ title: 'Sugerencia aplicada', description: 'La estructura guiada se aplico y puedes editarla antes de guardar.' })
    setShowGuidePanel(false)
    setGuidePreviewUnits(null)
    setGuideRejectedUnits([])
    setGuideRejectedTopics([])
    setGuideFeedbackNote('')
    setGuideRetryCount(0)
  }


  const handleExtract = async () => {
    if (!file) {
      toast({ title: 'Falta archivo', description: 'Selecciona un PDF, DOCX, DOC o imagen para autocompletar.' })
      return
    }

    setIsExtracting(true)
    setHasExtractRun(false)
    setSourceMeta(null)
    setExtractSummary(null)
    setShowGuidePanel(false)
    setGuidePreviewUnits(null)
    setGuideSummary(null)
    setGuideRejectedUnits([])
    setGuideRejectedTopics([])
    setGuideFeedbackNote('')
    setGuideRetryCount(0)
    setExtractProgress(8)
    setExtractStage('Subiendo archivo')

    try {
      const formData = new FormData()
      formData.append('file', file)

      setExtractProgress(24)
      setExtractStage('Leyendo contenido')

      const response = await fetch('/api/teacher/programs/extract', {
        method: 'POST',
        body: formData,
      })

      setExtractProgress(72)
      setExtractStage('Extrayendo unidades y temas con IA')

      const data = await response.json()
      if (!response.ok) {
        const detailMessage = data?.details ? ` (${data.details})` : ''
        throw new Error(`${data.error || 'No se pudo extraer el programa'}${detailMessage}`)
      }

      const extractedUnits = Array.isArray(data.units) && data.units.length > 0 ? sanitizeUnits(data.units) : []
      if (extractedUnits.length > 0) {
        setUnits(extractedUnits)
      }

      setSourceMeta({
        sourceFileName: data.sourceFileName,
        sourceMimeType: data.sourceMimeType,
        sourceFileSizeBytes: data.sourceFileSizeBytes,
      })

      setExtractSummary({
        extractionMethod: data.extractionMethod === 'heuristic' ? 'heuristic' : 'ai',
        extractionConfidence: Number(data.extractionConfidence || 0),
        lowConfidence: Boolean(data.lowConfidence),
        unitCount: Number(data?.summary?.unitCount || 0),
        topicCount: Number(data?.summary?.topicCount || 0),
      })

      if (Boolean(data.lowConfidence)) {
        const firstUnit = extractedUnits[0]
        setGuideUnitName(firstUnit?.name || '')
        setGuideTopicOne(firstUnit?.topics[0]?.name || '')
        setGuideTopicTwo(firstUnit?.topics[1]?.name || '')
        setGuidePreviewUnits(null)
        setGuideSummary(null)
        setGuideRejectedUnits([])
        setGuideRejectedTopics([])
        setGuideFeedbackNote('')
        setGuideRetryCount(0)
        setShowGuidePanel(true)
      } else {
        setShowGuidePanel(false)
      }

      setExtractProgress(100)
      setExtractStage('Validacion finalizada')

      const methodLabel = data.extractionMethod === 'heuristic' ? 'Heuristica' : 'IA'
      const confidencePercent = Math.round(Number(data.extractionConfidence || 0) * 100)
      toast({
        title: 'Autocompletado finalizado',
        description: `${data?.summary?.unitCount || 0} unidades, ${data?.summary?.topicCount || 0} temas. Metodo: ${methodLabel}. Confianza: ${confidencePercent}%`,
      })
    } catch (error) {
      toast({
        title: 'No se pudo procesar el archivo',
        description: error instanceof Error ? error.message : 'Error desconocido',
      })
    } finally {
      setIsExtracting(false)
      setHasExtractRun(true)
      setTimeout(() => {
        setExtractProgress(0)
        setExtractStage('Listo para procesar')
      }, 900)
    }
  }

  const handleSave = async () => {
    if (saveBlockerMessage) {
      toast({ title: 'No se puede guardar aun', description: saveBlockerMessage })
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(
        isEditing ? `/api/teacher/programs/${programToEdit?.id}` : '/api/teacher/programs',
        {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName,
          iconName,
          colorName,
          pedagogyProfile,
          units: sanitizeUnits(units),
          sourceFileName: sourceMeta?.sourceFileName ?? null,
          sourceMimeType: sourceMeta?.sourceMimeType ?? null,
          sourceFileSizeBytes: sourceMeta?.sourceFileSizeBytes ?? null,
        }),
      }
      )

      const data = await response.json()
      if (!response.ok) {
        const detailMessage = data?.details ? ` (${data.details})` : ''
        throw new Error(`${data.error || 'No se pudo guardar el programa'}${detailMessage}`)
      }

      const normalizedProgram: TeacherProgram = {
        id: data.program.id,
        userId: data.program.user_id,
        subjectName: data.program.subject_name,
        iconName: data.program.icon_name || iconName,
        colorName: data.program.color_name || colorName,
        pedagogyProfile: data.program.pedagogy_profile,
        units: data.program.units,
        sourceFileName: data.program.source_file_name,
        createdAt: data.program.created_at,
      }

      if (isEditing && onProgramUpdated) {
        onProgramUpdated(normalizedProgram)
      } else {
        onProgramCreated(normalizedProgram)
      }

      toast({
        title: isEditing ? 'Programa actualizado' : 'Programa guardado',
        description: isEditing
          ? 'Se actualizaron los datos de la materia docente.'
          : 'La materia docente ya esta disponible para generar cuestionarios.'
      })
      onOpenChange(false)
      resetForm()
    } catch (error) {
      toast({ title: 'Error al guardar', description: error instanceof Error ? error.message : 'Error desconocido' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Materia Docente' : 'Subir Programa'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica icono, color, estructura y datos pedagogicos de la materia.'
              : 'Carga un PDF, DOCX, DOC o imagen y completa los datos pedagogicos para crear la materia.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <Card className="p-4 space-y-3">
            <Label htmlFor="subject-name">Materia</Label>
            <Input
              id="subject-name"
              placeholder="Ej: Fisica I"
              value={subjectName}
              onChange={(event) => setSubjectName(event.target.value)}
            />

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Icono</Label>
                <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
                  <div className="w-8 h-8 rounded-md border flex items-center justify-center bg-muted">
                    <SelectedIconComponent className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">{iconName}</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {SUBJECT_ICON_OPTIONS.map((icon) => {
                    const Icon = iconMap[icon]
                    const isActive = iconName === icon
                    return (
                      <Button
                        key={icon}
                        type="button"
                        variant={isActive ? 'default' : 'outline'}
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
              <div className="space-y-1">
                <Label>Color</Label>
                <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
                  <span className={`w-4 h-4 rounded-full border ${colorSwatchClass[colorName]}`} />
                  <span className="text-sm font-medium">{colorName}</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {SUBJECT_COLOR_OPTIONS.map((color) => {
                    const isActive = colorName === color
                    return (
                      <Button
                        key={color}
                        type="button"
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setColorName(color)}
                        className="h-10 px-2"
                        title={color}
                      >
                        <span className={`w-4 h-4 rounded-full border ${colorSwatchClass[color]}`} />
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Nivel</Label>
                <Input
                  placeholder="Universitario"
                  value={pedagogyProfile.level}
                  onChange={(event) => setPedagogyProfile((prev) => ({ ...prev, level: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Carrera</Label>
                <Input
                  placeholder="Ingenieria"
                  value={pedagogyProfile.degree}
                  onChange={(event) => setPedagogyProfile((prev) => ({ ...prev, degree: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Ano</Label>
                <Input
                  placeholder="1ro"
                  value={pedagogyProfile.academicYear}
                  onChange={(event) => setPedagogyProfile((prev) => ({ ...prev, academicYear: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Complejidad</Label>
                <Input
                  placeholder="Basica / Intermedia / Avanzada"
                  value={pedagogyProfile.complexity}
                  onChange={(event) => setPedagogyProfile((prev) => ({ ...prev, complexity: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Enfoque (teorico, practico o mixto)</Label>
                <Input
                  placeholder="mixto"
                  value={pedagogyProfile.assessmentStyle}
                  onChange={(event) =>
                    setPedagogyProfile((prev) => ({
                      ...prev,
                      assessmentStyle: event.target.value as PedagogyProfile['assessmentStyle'],
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Metodologia de ensenanza</Label>
              <Textarea
                placeholder="Describe metodologias que quieres priorizar en ejercicios y explicaciones"
                value={pedagogyProfile.methodology}
                onChange={(event) => setPedagogyProfile((prev) => ({ ...prev, methodology: event.target.value }))}
                rows={3}
              />
            </div>
          </Card>

          {!isEditing && (
            <Card className="p-4 space-y-3">
                <Label htmlFor="program-file">Archivo del programa (PDF, DOCX, DOC, PNG o JPG, max 5MB)</Label>
              <Input
                id="program-file"
                type="file"
                  accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                onChange={handleFileChange}
              />

              <Button type="button" variant="outline" onClick={handleExtract} disabled={isExtracting || !file}>
                {isExtracting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Autocompletar con IA
              </Button>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Estado: {extractStage}</span>
                    <span>{extractProgress}%</span>
                  </div>
                  <div className="h-2 rounded bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${extractProgress}%` }}
                    />
                  </div>
                </div>

              {sourceMeta && (
                <p className="text-sm text-muted-foreground">
                  Archivo procesado: {sourceMeta.sourceFileName} (se conserva temporalmente 24h)
                </p>
              )}

                {extractSummary && (
                  <p className={`text-sm ${extractSummary.lowConfidence ? 'text-amber-700' : 'text-emerald-700'}`}>
                    Resultado: {extractSummary.unitCount} unidades y {extractSummary.topicCount} temas.
                    Confianza estimada: {Math.round(extractSummary.extractionConfidence * 100)}%.
                    Metodo: {extractSummary.extractionMethod === 'heuristic' ? 'Heuristica' : 'IA'}.
                    {extractSummary.lowConfidence ? ' Revisa cuidadosamente porque hay baja confianza.' : ''}
                  </p>
                )}

              {extractSummary?.lowConfidence && (
                <p className="text-sm text-amber-700">
                  Recomendacion: usa "Guiar autocompletado" con 1 unidad y 2 temas para continuar desde el documento.
                </p>
              )}

              {hasExtractRun && extractSummary?.lowConfidence && showGuidePanel && (
                <Card className="p-4 space-y-3 border-dashed">
                  <h4 className="font-medium">Guiar autocompletado</h4>
                  <p className="text-sm text-muted-foreground">
                    Completa una unidad y dos temas de referencia. Se buscara en el documento y se sugeriran los contenidos siguientes.
                  </p>

                  <Input
                    placeholder="Unidad de referencia"
                    value={guideUnitName}
                    onChange={(event) => setGuideUnitName(event.target.value)}
                  />

                  <div className="grid sm:grid-cols-2 gap-2">
                    <Input
                      placeholder="Tema de referencia 1"
                      value={guideTopicOne}
                      onChange={(event) => setGuideTopicOne(event.target.value)}
                    />
                    <Input
                      placeholder="Tema de referencia 2"
                      value={guideTopicTwo}
                      onChange={(event) => setGuideTopicTwo(event.target.value)}
                    />
                  </div>

                  <Textarea
                    placeholder="Opcional: indica que partes salieron mal o que quieres que busque distinto"
                    value={guideFeedbackNote}
                    onChange={(event) => setGuideFeedbackNote(event.target.value)}
                    rows={2}
                  />

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={guidePreviewUnits && guidePreviewUnits.length > 0 ? 'outline' : 'default'}
                      onClick={handleGuideAutocomplete}
                      disabled={isGuiding || !sourceMeta}
                    >
                      {isGuiding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      {isGuiding
                        ? 'Analizando documento...'
                        : guidePreviewUnits && guidePreviewUnits.length > 0
                          ? 'Actualizar vista previa con correcciones'
                          : 'Generar vista previa guiada'}
                    </Button>
                  </div>

                  {guideSummary && (
                    <p className={`text-sm ${guideSummary.lowConfidence ? 'text-amber-700' : 'text-emerald-700'}`}>
                      Vista previa: {guideSummary.unitCount} unidades y {guideSummary.topicCount} temas.
                      Confianza: {Math.round(guideSummary.guideConfidence * 100)}%.
                      Metodo: {guideSummary.extractionMethod === 'heuristic' ? 'Heuristica' : 'IA'}.
                      Estrategia: {guideSummary.strategy === 'hybrid' ? 'Hibrida' : guideSummary.strategy === 'numbering' ? 'Numeracion' : 'Similitud'}.
                    </p>
                  )}

                  {guidePreviewUnits && guidePreviewUnits.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Vista previa antes de aplicar</p>
                      <div className="max-h-56 overflow-y-auto rounded-md border p-2 space-y-2">
                        {guidePreviewUnits.map((unit, unitIndex) => (
                          <div key={unit.id} className="text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium">{unitIndex + 1}. {unit.name}</p>
                              <Button
                                type="button"
                                size="sm"
                                variant={isRejectedUnit(unit.name) ? 'default' : 'outline'}
                                onClick={() => toggleRejectedUnit(unit.name)}
                              >
                                {isRejectedUnit(unit.name) ? 'Unidad marcada como incorrecta' : 'Esta unidad esta mal'}
                              </Button>
                            </div>
                            <ul className="list-disc pl-5 text-muted-foreground">
                              {unit.topics.map((topic) => (
                                <li key={topic.id} className="flex items-center justify-between gap-2">
                                  <span>{topic.name}</span>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant={isRejectedTopic(topic.name) ? 'default' : 'ghost'}
                                    onClick={() => toggleRejectedTopic(topic.name)}
                                  >
                                    {isRejectedTopic(topic.name) ? 'Tema incorrecto' : 'Este tema esta mal'}
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" onClick={handleApplyGuidePreview}>
                          Aplicar sugerencia
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </Card>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Estructura Curricular</h3>
              <Button type="button" variant="secondary" onClick={addUnit}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar unidad
              </Button>
            </div>

            {units.map((unit, unitIndex) => (
              <Card key={unit.id} className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder={`Unidad ${unitIndex + 1}`}
                    value={unit.name}
                    onChange={(event) => updateUnitName(unitIndex, event.target.value)}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeUnit(unitIndex)} disabled={units.length === 1}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-3 pl-3 border-l">
                  {unit.topics.map((topic, topicIndex) => (
                    <div key={topic.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder={`Tema ${topicIndex + 1}`}
                          value={topic.name}
                          onChange={(event) => updateTopicName(unitIndex, topicIndex, event.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTopic(unitIndex, topicIndex)}
                          disabled={unit.topics.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                    </div>
                  ))}

                  <Button type="button" variant="outline" size="sm" onClick={() => addTopic(unitIndex)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar tema
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={!canSave}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isEditing ? 'Guardar cambios' : 'Guardar programa'}
            </Button>
          </div>
          {saveBlockerMessage && (
            <p className="text-sm text-amber-700">{saveBlockerMessage}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
