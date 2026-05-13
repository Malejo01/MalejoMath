'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Download, Link2, Loader2 } from 'lucide-react'

interface ShareQuizDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExportMoodle: () => void
  isExporting?: boolean
}

export function ShareQuizDialog({
  open,
  onOpenChange,
  onExportMoodle,
  isExporting = false,
}: ShareQuizDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-2 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 text-left">
          <DialogTitle className="text-xl font-black text-foreground">Compartir cuestionario</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Elige como deseas compartir este cuestionario con tus alumnos.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-3">
          <Button
            type="button"
            onClick={onExportMoodle}
            disabled={isExporting}
            className="w-full justify-start h-12 rounded-xl"
          >
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Exportar para Moodle
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled
            className="w-full justify-start h-12 rounded-xl"
          >
            <Link2 className="w-4 h-4 mr-2" />
            Compartir enlace a alumnos (Proximamente)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
