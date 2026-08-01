'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Check, Download, Link2, Loader2, Users } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { TeacherQuiz } from '@/lib/types'

interface ClassroomOption {
  id: number
  name: string
  join_code: string
  status: 'open' | 'closed'
  teacher_program_id: number
  subject_name: string
  member_count: number
}

interface ShareQuizDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExportMoodle: () => void
  isExporting?: boolean
  /** The quiz being shared; needed to publish it into an aula. */
  quiz?: TeacherQuiz | null
  /** Lets the caller send the teacher to the Aulas section to create one. */
  onGoToClassrooms?: () => void
}

/**
 * Turns a datetime-local value into an ISO string. The input has no timezone,
 * so the browser reads it as local time — which is what the teacher meant when
 * they typed "viernes 23:59".
 */
function localInputToIso(value: string): string | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

export function ShareQuizDialog({
  open,
  onOpenChange,
  onExportMoodle,
  isExporting = false,
  quiz = null,
  onGoToClassrooms,
}: ShareQuizDialogProps) {
  const { toast } = useToast()

  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([])
  const [isLoadingClassrooms, setIsLoadingClassrooms] = useState(false)
  const [selectedClassroomId, setSelectedClassroomId] = useState<number | null>(null)
  const [dueAt, setDueAt] = useState('')
  const [opensAt, setOpensAt] = useState('')
  const [maxAttempts, setMaxAttempts] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [assignedTo, setAssignedTo] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setSelectedClassroomId(null)
      setOpensAt('')
      setDueAt('')
      setMaxAttempts('')
      setAssignedTo(null)
      return
    }

    let isMounted = true
    setIsLoadingClassrooms(true)

    fetch('/api/teacher/classrooms')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return
        setClassrooms(Array.isArray(data.classrooms) ? data.classrooms : [])
      })
      .catch(() => {
        if (isMounted) setClassrooms([])
      })
      .finally(() => {
        if (isMounted) setIsLoadingClassrooms(false)
      })

    return () => {
      isMounted = false
    }
  }, [open])

  // An aula hands out one subject, so only aulas of this quiz's materia can
  // receive it — the API enforces the same rule.
  const eligibleClassrooms = useMemo(() => {
    if (!quiz) return []
    return classrooms.filter((classroom) => Number(classroom.teacher_program_id) === Number(quiz.teacherProgramId))
  }, [classrooms, quiz])

  const handleAssign = async () => {
    if (!quiz || !selectedClassroomId) {
      toast({ title: 'Elegí un aula', description: 'Seleccioná a qué aula querés enviarlo.' })
      return
    }

    const parsedAttempts = maxAttempts.trim() ? Number(maxAttempts) : null
    if (parsedAttempts !== null && (!Number.isInteger(parsedAttempts) || parsedAttempts < 1)) {
      toast({ title: 'Intentos inválidos', description: 'El máximo de intentos tiene que ser un número mayor a 0.' })
      return
    }

    setIsAssigning(true)

    try {
      const response = await fetch(`/api/teacher/classrooms/${selectedClassroomId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherQuizId: quiz.id,
          opensAt: localInputToIso(opensAt),
          dueAt: localInputToIso(dueAt),
          maxAttempts: parsedAttempts,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo asignar el cuestionario')
      }

      const classroom = eligibleClassrooms.find((item) => item.id === selectedClassroomId)
      setAssignedTo(classroom?.name ?? 'el aula')
      toast({
        title: 'Cuestionario asignado',
        description: `Tus alumnos de ${classroom?.name ?? 'el aula'} ya lo ven en Mis aulas.`,
      })
    } catch (error) {
      toast({
        title: 'No se pudo asignar',
        description: error instanceof Error ? error.message : 'Error desconocido',
      })
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl border-2 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl font-black text-foreground">Compartir cuestionario</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Enviálo a un aula para que tus alumnos lo resuelvan, o exportálo a Moodle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Enviar a un aula</h3>
            </div>

            {isLoadingClassrooms && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Buscando tus aulas...
              </p>
            )}

            {!isLoadingClassrooms && eligibleClassrooms.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Todavía no tenés un aula para esta materia. Creá una para repartir el código a tus alumnos.
                </p>
                {onGoToClassrooms && (
                  <Button type="button" variant="outline" size="sm" onClick={onGoToClassrooms}>
                    <Users className="w-4 h-4 mr-2" />
                    Ir a Aulas
                  </Button>
                )}
              </div>
            )}

            {!isLoadingClassrooms && eligibleClassrooms.length > 0 && (
              <>
                <div className="flex flex-wrap gap-2">
                  {eligibleClassrooms.map((classroom) => (
                    <Button
                      key={classroom.id}
                      type="button"
                      size="sm"
                      variant={selectedClassroomId === classroom.id ? 'default' : 'outline'}
                      onClick={() => setSelectedClassroomId(classroom.id)}
                    >
                      {classroom.name}
                      <span className="ml-1.5 text-[11px] opacity-70">
                        {classroom.member_count} {classroom.member_count === 1 ? 'alumno' : 'alumnos'}
                      </span>
                    </Button>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Disponible desde (opcional)</Label>
                    <Input
                      type="datetime-local"
                      value={opensAt}
                      onChange={(event) => setOpensAt(event.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fecha límite (opcional)</Label>
                    <Input
                      type="datetime-local"
                      value={dueAt}
                      onChange={(event) => setDueAt(event.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Máximo de intentos (vacío = sin límite)</Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Sin límite"
                    value={maxAttempts}
                    onChange={(event) => setMaxAttempts(event.target.value)}
                    className="h-9 max-w-[160px]"
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleAssign}
                  disabled={isAssigning || !selectedClassroomId}
                  className="w-full h-11 rounded-xl"
                >
                  {isAssigning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
                  Enviar al aula
                </Button>

                {assignedTo && (
                  <p className="text-sm text-emerald-700 flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Asignado a {assignedTo}.
                  </p>
                )}
              </>
            )}
          </Card>

          <Button
            type="button"
            variant="outline"
            onClick={onExportMoodle}
            disabled={isExporting}
            className="w-full justify-start h-12 rounded-xl"
          >
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Exportar para Moodle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
