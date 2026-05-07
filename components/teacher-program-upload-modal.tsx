'use client'

import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Trash2, Upload } from 'lucide-react'
import type { PedagogyProfile, ProgramUnit, TeacherProgram } from '@/lib/types'

interface TeacherProgramUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProgramCreated: (program: TeacherProgram) => void
}

const defaultPedagogy: PedagogyProfile = {
  level: '',
  degree: '',
  academicYear: '',
  complexity: '',
  assessmentStyle: 'mixto',
  methodology: '',
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
          subtopics: [{ id: 'unit-1-topic-1-sub-1', name: '' }],
        },
      ],
    },
  ]
}

export function TeacherProgramUploadModal({
  open,
  onOpenChange,
  onProgramCreated,
}: TeacherProgramUploadModalProps) {
  const { toast } = useToast()
  const [subjectName, setSubjectName] = useState('')
  const [pedagogyProfile, setPedagogyProfile] = useState<PedagogyProfile>(defaultPedagogy)
  const [units, setUnits] = useState<ProgramUnit[]>(createInitialUnits())
  const [file, setFile] = useState<File | null>(null)
  const [sourceMeta, setSourceMeta] = useState<{
    sourceFileName: string
    sourceMimeType: string
    sourceFileSizeBytes: number
  } | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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
      return unit.topics.every((topic) => {
        if (!topic.name.trim() || !topic.subtopics.length) return false
        return topic.subtopics.every((subtopic) => subtopic.name.trim().length > 0)
      })
    })
  }, [units])

  const saveBlockerMessage = useMemo(() => {
    if (!subjectName.trim()) return 'Completa el nombre de la materia.'
    if (!isPedagogyValid) return 'Completa todos los datos pedagogicos obligatorios.'
    if (!hasValidStructure) return 'Revisa la estructura: cada unidad debe tener temas y cada tema al menos un subtema con nombre.'
    return null
  }, [subjectName, isPedagogyValid, hasValidStructure])

  const canSave = !isSaving && !saveBlockerMessage

  const resetForm = () => {
    setSubjectName('')
    setPedagogyProfile(defaultPedagogy)
    setUnits(createInitialUnits())
    setFile(null)
    setSourceMeta(null)
  }

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

  const updateSubtopicName = (unitIndex: number, topicIndex: number, subIndex: number, value: string) => {
    setUnits((prev) =>
      prev.map((unit, uIndex) => {
        if (uIndex !== unitIndex) return unit
        return {
          ...unit,
          topics: unit.topics.map((topic, tIndex) => {
            if (tIndex !== topicIndex) return topic
            return {
              ...topic,
              subtopics: topic.subtopics.map((subtopic, sIndex) =>
                sIndex === subIndex ? { ...subtopic, name: value } : subtopic
              ),
            }
          }),
        }
      })
    )
  }

  const addUnit = () => {
    setUnits((prev) => [
      ...prev,
      {
        id: `unit-${Date.now()}`,
        name: '',
        topics: [
          {
            id: `unit-${Date.now()}-topic-1`,
            name: '',
            subtopics: [{ id: `unit-${Date.now()}-topic-1-sub-1`, name: '' }],
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
              subtopics: [{ id: `${unit.id}-topic-${unit.topics.length + 1}-sub-1`, name: '' }],
            },
          ],
        }
      })
    )
  }

  const addSubtopic = (unitIndex: number, topicIndex: number) => {
    setUnits((prev) =>
      prev.map((unit, uIndex) => {
        if (uIndex !== unitIndex) return unit

        return {
          ...unit,
          topics: unit.topics.map((topic, tIndex) => {
            if (tIndex !== topicIndex) return topic

            return {
              ...topic,
              subtopics: [...topic.subtopics, { id: `${topic.id}-sub-${topic.subtopics.length + 1}`, name: '' }],
            }
          }),
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

  const removeSubtopic = (unitIndex: number, topicIndex: number, subIndex: number) => {
    setUnits((prev) =>
      prev.map((unit, uIndex) => {
        if (uIndex !== unitIndex) return unit

        return {
          ...unit,
          topics: unit.topics.map((topic, tIndex) => {
            if (tIndex !== topicIndex) return topic
            return { ...topic, subtopics: topic.subtopics.filter((_, sIndex) => sIndex !== subIndex) }
          }),
        }
      })
    )
  }

  const handleExtract = async () => {
    if (!file) {
      toast({ title: 'Falta archivo', description: 'Selecciona un PDF o DOCX para autocompletar.' })
      return
    }

    setIsExtracting(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/teacher/programs/extract', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        const detailMessage = data?.details ? ` (${data.details})` : ''
        throw new Error(`${data.error || 'No se pudo extraer el programa'}${detailMessage}`)
      }

      if (Array.isArray(data.units) && data.units.length > 0) {
        setUnits(data.units)
      }

      setSourceMeta({
        sourceFileName: data.sourceFileName,
        sourceMimeType: data.sourceMimeType,
        sourceFileSizeBytes: data.sourceFileSizeBytes,
      })

      toast({ title: 'Programa detectado', description: 'La IA completo la estructura. Revisa y edita antes de guardar.' })
    } catch (error) {
      toast({
        title: 'No se pudo procesar el archivo',
        description: error instanceof Error ? error.message : 'Error desconocido',
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const handleSave = async () => {
    if (saveBlockerMessage) {
      toast({ title: 'No se puede guardar aun', description: saveBlockerMessage })
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/teacher/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName,
          pedagogyProfile,
          units,
          sourceFileName: sourceMeta?.sourceFileName ?? null,
          sourceMimeType: sourceMeta?.sourceMimeType ?? null,
          sourceFileSizeBytes: sourceMeta?.sourceFileSizeBytes ?? null,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        const detailMessage = data?.details ? ` (${data.details})` : ''
        throw new Error(`${data.error || 'No se pudo guardar el programa'}${detailMessage}`)
      }

      onProgramCreated({
        id: data.program.id,
        userId: data.program.user_id,
        subjectName: data.program.subject_name,
        pedagogyProfile: data.program.pedagogy_profile,
        units: data.program.units,
        sourceFileName: data.program.source_file_name,
        createdAt: data.program.created_at,
      })

      toast({ title: 'Programa guardado', description: 'La materia docente ya esta disponible para generar cuestionarios.' })
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
          <DialogTitle>Subir Programa</DialogTitle>
          <DialogDescription>
            Carga un PDF o DOCX y completa los datos pedagogicos para crear la materia.
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

          <Card className="p-4 space-y-3">
            <Label htmlFor="program-file">Archivo del programa (PDF o DOCX, max 5MB)</Label>
            <Input
              id="program-file"
              type="file"
              accept=".pdf,.docx"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />

            <Button type="button" variant="outline" onClick={handleExtract} disabled={isExtracting || !file}>
              {isExtracting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Autocompletar con IA
            </Button>

            {sourceMeta && (
              <p className="text-sm text-muted-foreground">
                Archivo procesado: {sourceMeta.sourceFileName} (se conserva temporalmente 24h)
              </p>
            )}
          </Card>

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

                      <div className="space-y-2 pl-3 border-l">
                        {topic.subtopics.map((subtopic, subIndex) => (
                          <div key={subtopic.id} className="flex items-center gap-2">
                            <Input
                              placeholder={`Subtema ${subIndex + 1}`}
                              value={subtopic.name}
                              onChange={(event) => updateSubtopicName(unitIndex, topicIndex, subIndex, event.target.value)}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSubtopic(unitIndex, topicIndex, subIndex)}
                              disabled={topic.subtopics.length === 1}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => addSubtopic(unitIndex, topicIndex)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar subtema
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
              Guardar programa
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
