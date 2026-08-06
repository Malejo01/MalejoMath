'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, FileText, Landmark, PenTool, ArrowRight, Clock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type SubjectPath = 'import' | 'curriculum' | 'manual'

interface TeacherOnboardingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectPath: (path: SubjectPath) => void
}

/**
 * Tour de bienvenida del panel docente: dos pantallas, no cinco.
 *
 * La versión anterior dedicaba una pantalla de prosa a cada camino y prometía
 * "magia en segundos" sobre un botón que en realidad abre el paso 1 de un
 * wizard de cuatro pasos. Un docente que apretaba "Subir archivo" esperando
 * subir un archivo se encontraba con un formulario de nivel y año, y esa
 * distancia entre lo prometido y lo que pasa es lo que hace que un onboarding
 * se sienta a publicidad.
 *
 * Por eso acá los tres caminos van juntos en una sola pantalla comparable, y
 * cada uno dice explícitamente qué se pide antes de llegar a lo suyo. El tour
 * se puede leer entero en menos de dos minutos, que era el pedido original.
 */

const PATHS: {
  id: SubjectPath
  icon: LucideIcon
  accent: string
  title: string
  pitch: string
  /** Qué pasa REALMENTE al apretar. No se promete nada que el wizard no haga. */
  then: string
  cta: string
}[] = [
  {
    id: 'import',
    icon: FileText,
    accent: 'text-blue-600 bg-blue-500/10',
    title: 'Subir tu programa',
    pitch: 'Ya tenés el plan en PDF, Word o una foto.',
    then: 'La IA lo lee y arma las unidades por vos.',
    cta: 'Subir un archivo',
  },
  {
    id: 'curriculum',
    icon: Landmark,
    accent: 'text-amber-600 bg-amber-500/10',
    title: 'Usar el diseño curricular',
    pitch: 'Preferís partir de los contenidos oficiales.',
    then: 'Cargamos los ejes y temas de tu jurisdicción.',
    cta: 'Ver la currícula',
  },
  {
    id: 'manual',
    icon: PenTool,
    accent: 'text-emerald-600 bg-emerald-500/10',
    title: 'Escribirlo vos',
    pitch: 'Tenés tu propio recorte y querés control total.',
    then: 'Escribís las unidades a mano, con ayuda de la IA si querés.',
    cta: 'Empezar en blanco',
  },
]

export function TeacherOnboardingModal({ open, onOpenChange, onSelectPath }: TeacherOnboardingModalProps) {
  const [step, setStep] = useState<0 | 1>(0)

  const close = () => {
    onOpenChange(false)
    setStep(0)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close()
        else onOpenChange(true)
      }}
    >
      <DialogContent className="sm:max-w-[620px]">
        <DialogTitle className="sr-only">Bienvenida al panel docente</DialogTitle>
        <DialogDescription className="sr-only">
          Presentación de las tres formas de armar el programa de una materia en MaestrIA.
        </DialogDescription>

        {step === 0 ? (
          <div className="text-center space-y-5 py-2">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight">Te damos la bienvenida a MaestrIA</h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
                Todo acá arranca con una <strong className="text-foreground">materia</strong>: el nivel, el año y la
                lista de temas que vas a dar. Con eso la IA genera cuestionarios alineados a tu programa, y no a un
                temario genérico.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
                Se arma una sola vez y después la reutilizás todo el año.
              </p>
            </div>

            <div className="flex flex-col items-center gap-2 pt-1">
              <Button size="lg" onClick={() => setStep(1)}>
                Ver las tres formas de armarla
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="ghost" size="sm" onClick={close} className="text-muted-foreground">
                Explorar por mi cuenta
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="text-center space-y-1.5">
              <h2 className="text-xl font-bold tracking-tight">¿Cómo querés armar el temario?</h2>
              <p className="text-muted-foreground text-sm">
                Elegí una. Podés combinarlas después, y cambiar de idea sin perder nada.
              </p>
            </div>

            {/* Expectativa honesta: el wizard SIEMPRE pide nivel, año y materia
                antes del temario, sin importar el camino elegido. Decirlo acá
                evita que el docente sienta que el botón no hizo lo que decía. */}
            <div className="flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <p>
                Con cualquiera de las tres, primero te pedimos{' '}
                <strong className="text-foreground">nivel, año y nombre de la materia</strong> — son dos pasos cortos.
                Recién ahí entra a jugar el camino que elijas.
              </p>
            </div>

            <div className="space-y-2.5">
              {PATHS.map((path) => {
                const Icon = path.icon
                return (
                  <button
                    key={path.id}
                    type="button"
                    onClick={() => onSelectPath(path.id)}
                    className="w-full text-left rounded-xl border bg-card p-3.5 flex items-start gap-3 hover:border-primary/50 hover:bg-accent/5 transition-colors group"
                  >
                    <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${path.accent}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="font-semibold leading-tight">{path.title}</p>
                      <p className="text-sm text-muted-foreground leading-snug">{path.pitch}</p>
                      <p className="text-xs text-muted-foreground/80 leading-snug">{path.then}</p>
                    </div>
                    <span className="text-xs font-medium text-primary shrink-0 self-center flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {path.cta}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-between pt-1">
              <Button variant="ghost" size="sm" onClick={() => setStep(0)} className="text-muted-foreground">
                Volver
              </Button>
              <Button variant="ghost" size="sm" onClick={close} className="text-muted-foreground">
                Explorar por mi cuenta
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
