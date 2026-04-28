'use client'

import { BookOpen, Calculator, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface QuizModeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectMode: (mode: 'teorico' | 'practico') => void
  isLoading?: boolean
  title?: string
  description?: string
}

const modeCards = [
  {
    mode: 'teorico' as const,
    title: 'Examen Teorico',
    description: 'Conceptos, definiciones, propiedades y fundamentos.',
    icon: BookOpen,
    accent: 'from-sky-500 to-cyan-400',
    border: 'border-sky-200 hover:border-sky-400',
    background: 'from-sky-50 to-cyan-50',
  },
  {
    mode: 'practico' as const,
    title: 'Examen Practico',
    description: 'Resolucion de ejercicios, cuentas y aplicacion directa.',
    icon: Calculator,
    accent: 'from-orange-500 to-amber-400',
    border: 'border-orange-200 hover:border-orange-400',
    background: 'from-orange-50 to-amber-50',
  },
]

export function QuizModeDialog({
  open,
  onOpenChange,
  onSelectMode,
  isLoading = false,
  title = 'Elegir tipo de cuestionario',
  description = 'Selecciona si quieres practicar con un examen teorico o practico.',
}: QuizModeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-2 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 text-left">
          <DialogTitle className="text-xl font-black text-foreground">{title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-3">
          {modeCards.map(({ mode, title: modeTitle, description: modeDescription, icon: Icon, accent, border, background }) => (
            <Button
              key={mode}
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => onSelectMode(mode)}
              className={cn(
                'h-auto w-full justify-start rounded-2xl border-2 px-4 py-4 text-left',
                'bg-gradient-to-br shadow-sm transition-all hover:scale-[1.01] hover:shadow-md',
                border,
                background
              )}
            >
              <div className="flex w-full items-center gap-4">
                <div className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg',
                  accent
                )}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-foreground">{modeTitle}</div>
                  <div className="text-sm text-muted-foreground whitespace-normal">{modeDescription}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}