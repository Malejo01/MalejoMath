'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, FileText, Landmark, PenTool, ChevronLeft, ChevronRight } from 'lucide-react'

interface TeacherOnboardingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectPath: (path: 'import' | 'curriculum' | 'manual') => void
}

const slides = [
  {
    id: 'welcome',
    icon: Sparkles,
    iconBg: 'bg-primary/10 text-primary',
    title: '¡Te damos la bienvenida a MaestrIA!',
    subtitle: 'Tu tiempo vale oro. ⏳',
    body: 'Sabemos lo agotador que puede ser planificar. Deja que la IA haga el trabajo pesado por ti. Hemos diseñado MaestrIA para aligerar tu carga administrativa y devolverte esas horas extra. Queremos que tengas más tiempo para lo que realmente importa: enseñar e inspirar a tus alumnos.',
  },
  {
    id: 'import',
    icon: FileText,
    iconBg: 'bg-blue-500/10 text-blue-600',
    title: 'Opción 1: Magia en segundos 🪄',
    subtitle: 'Sube tu programa actual y nosotros hacemos el resto.',
    subtitleColor: 'text-blue-600',
    body: '¿Ya tienes un PDF, un Word o incluso una foto de tu plan de estudios de años anteriores? Súbelo. Nuestra IA lo leerá, extraerá los temas principales y estructurará tus unidades de forma automática.',
    action: 'import' as const,
    actionLabel: 'Subir archivo',
    actionColor: 'bg-blue-600 hover:bg-blue-700',
  },
  {
    id: 'curriculum',
    icon: Landmark,
    iconBg: 'bg-amber-500/10 text-amber-600',
    title: 'Opción 2: Currículums Oficiales 🏛️',
    subtitle: 'Alineado a tu jurisdicción sin esfuerzo.',
    subtitleColor: 'text-amber-600',
    body: 'Selecciona tu región, el nivel y la materia. Cargaremos automáticamente los ejes temáticos oficiales y los contenidos prioritarios para que no tengas que tipearlos desde cero.',
    action: 'curriculum' as const,
    actionLabel: 'Elegir currículum oficial',
    actionColor: 'bg-amber-600 hover:bg-amber-700',
  },
  {
    id: 'manual',
    icon: PenTool,
    iconBg: 'bg-emerald-500/10 text-emerald-600',
    title: 'Opción 3: A tu medida ✍️',
    subtitle: 'Control total sobre cada unidad y tema.',
    subtitleColor: 'text-emerald-600',
    body: 'Si prefieres construir tu programa paso a paso, con un enfoque único y 100% personalizado, el lienzo en blanco es tuyo. Siempre podrás sumar la ayuda de nuestra IA más adelante en el proceso.',
    action: 'manual' as const,
    actionLabel: 'Crear manualmente',
    actionColor: 'bg-emerald-600 hover:bg-emerald-700',
  },
] as const

export function TeacherOnboardingModal({ open, onOpenChange, onSelectPath }: TeacherOnboardingModalProps) {
  const [current, setCurrent] = useState(0)
  const slide = slides[current]
  const Icon = slide.icon

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setCurrent(0); onOpenChange(v) }}>
      <DialogContent className="sm:max-w-[540px] overflow-hidden bg-white/95 backdrop-blur-xl border-white/20">
        <DialogTitle className="sr-only">Onboarding de MaestrIA</DialogTitle>
        <DialogDescription className="sr-only">Guía paso a paso para configurar tu materia.</DialogDescription>

        <div className="text-center space-y-5">
          {/* Icon */}
          <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ${slide.iconBg}`}>
            <Icon className="w-7 h-7" />
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight leading-snug">{slide.title}</h2>
            {'subtitleColor' in slide ? (
              <p className={`font-medium ${slide.subtitleColor}`}>{slide.subtitle}</p>
            ) : (
              <p className="text-muted-foreground font-medium">{slide.subtitle}</p>
            )}
          </div>

          {/* Body */}
          <p className="text-muted-foreground text-sm leading-relaxed">{slide.body}</p>

          {/* Actions */}
          <div className="pt-2 flex flex-col items-center gap-2">
            {current === 0 ? (
              <Button size="lg" onClick={() => setCurrent(1)}>
                ¿Empezamos a armar tu primera materia?
              </Button>
            ) : (
              <>
                {'action' in slide && (
                  <Button
                    size="lg"
                    className={slide.actionColor}
                    onClick={() => onSelectPath(slide.action)}
                  >
                    {slide.actionLabel}
                  </Button>
                )}
                {current === slides.length - 1 && (
                  <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-muted-foreground">
                    Explorar la plataforma primero
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={current === 0}
            onClick={() => setCurrent((c) => c - 1)}
            aria-label="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                className={`h-2 rounded-full transition-all ${current === idx ? 'bg-primary w-5' : 'bg-primary/20 w-2'}`}
                onClick={() => setCurrent(idx)}
                aria-label={`Ir a pantalla ${idx + 1}`}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={current === slides.length - 1}
            onClick={() => setCurrent((c) => c + 1)}
            aria-label="Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
