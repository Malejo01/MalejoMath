'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LaTeXRenderer } from './latex-renderer'
import { Lightbulb, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'

interface ExplanationModalProps {
  open: boolean
  onClose: () => void
  question: string
  correctAnswer: string
  userAnswer: string
  explanation: string
  isCorrect: boolean
}

export function ExplanationModal({
  open,
  onClose,
  question,
  correctAnswer,
  userAnswer,
  explanation,
  isCorrect
}: ExplanationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-4 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Explicacion del Error
          </DialogTitle>
          <DialogDescription>
            Analiza paso a paso por que tu respuesta fue incorrecta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Question Recap */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium text-muted-foreground mb-2">Pregunta:</p>
            <p className="text-foreground">
              <LaTeXRenderer content={question} />
            </p>
          </div>

          {/* Answers Comparison */}
          <div className="grid gap-3">
            {/* User Answer */}
            <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-destructive mb-1">Tu respuesta:</p>
                <p className="text-foreground">
                  <LaTeXRenderer content={userAnswer} />
                </p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
            </div>

            {/* Correct Answer */}
            <div className="flex items-start gap-3 p-3 bg-accent/10 rounded-lg border border-accent/20">
              <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-accent mb-1">Respuesta correcta:</p>
                <p className="text-foreground">
                  <LaTeXRenderer content={correctAnswer} />
                </p>
              </div>
            </div>
          </div>

          {/* Step by Step Explanation */}
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              Razonamiento paso a paso:
            </p>
            <div className="text-sm text-muted-foreground leading-relaxed">
              <LaTeXRenderer content={explanation} />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button onClick={onClose} className="w-full">
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
