'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LaTeXRenderer } from './latex-renderer'
import { Lightbulb, CheckCircle2, Trash2, Sparkles, BookOpen, ChevronRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import type { StudentTip } from '@/lib/types'

interface TipsChestProps {
  tips: StudentTip[]
  onToggleResolved?: (id: number | string) => void
  onRemoveTip?: (id: number | string) => void
}

export function TipsChest({ tips, onToggleResolved, onRemoveTip }: TipsChestProps) {
  const [activeSubjectModal, setActiveSubjectModal] = useState<string | null>(null)

  if (!tips || tips.length === 0) {
    return (
      <Card className="p-8 text-center bg-card/60 backdrop-blur border-2 border-dashed border-border rounded-3xl">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
          <Lightbulb className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-lg text-foreground mb-1">Cofre de Tips Vacío</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Cada vez que le pidas a la IA que te explique un error, extraerá automáticamente su mejor consejo y lo guardará aquí como apunte de estudio para tus exámenes.
        </p>
      </Card>
    )
  }

  // Group tips by subject
  const groupedTips = tips.reduce((acc, tipItem) => {
    const sub = tipItem.subject || 'General'
    if (!acc[sub]) {
      acc[sub] = []
    }
    acc[sub].push(tipItem)
    return acc
  }, {} as Record<string, StudentTip[]>)

  const entries = Object.entries(groupedTips)

  return (
    <section className="space-y-4 mt-6">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white shadow-sm">
          <Sparkles className="w-4 h-4 fill-white" />
        </div>
        <h3 className="font-bold text-foreground text-lg">Mis Apuntes e Ideas Clave</h3>
      </div>

      {/* Grid of Subject Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {entries.map(([subjectName, subjectTips]) => (
          <Card
            key={subjectName}
            onClick={() => setActiveSubjectModal(subjectName)}
            className="p-4 border-2 border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-yellow-50/50 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm group-hover:text-amber-600 transition-colors capitalize">
                  {subjectName}
                </h4>
                <p className="text-xs text-muted-foreground font-medium">
                  {subjectTips.length} apunte{subjectTips.length > 1 ? 's' : ''} e idea{subjectTips.length > 1 ? 's' : ''} clave
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-xs font-bold text-amber-600 dark:text-amber-400 gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              <span>Ver</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Card>
        ))}
      </div>

      {/* Subject Tips Modal */}
      {entries.map(([subjectName, subjectTips]) => {
        const isOpen = activeSubjectModal === subjectName
        return (
          <Dialog
            key={subjectName}
            open={isOpen}
            onOpenChange={(open) => setActiveSubjectModal(open ? subjectName : null)}
          >
            <DialogContent className="max-w-2xl mx-4 max-h-[85vh] overflow-y-auto rounded-3xl p-6 shadow-2xl border-2 border-amber-200">
              <DialogHeader className="space-y-1 text-left">
                <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-foreground capitalize">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  Apuntes e ideas clave — {subjectName}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Consejos pedagógicos extraídos por la IA durante tus tutorías para repasar antes de tus pruebas.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3.5 mt-3 sm:grid-cols-1">
                {subjectTips.map((tipItem, idx) => {
                  const tipId = tipItem.id || `tip-${idx}`
                  return (
                    <Card
                      key={tipId}
                      className={`p-4.5 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 ${
                        tipItem.resolved
                          ? 'bg-emerald-500/5 border-emerald-500/20 opacity-80'
                          : 'bg-card border-amber-200/80 shadow-sm'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            {tipItem.topicName}
                          </span>

                          <div className="flex items-center gap-1">
                            {onToggleResolved && (
                              <button
                                onClick={() => onToggleResolved(tipId)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  tipItem.resolved ? 'text-emerald-500 bg-emerald-500/10' : 'text-muted-foreground hover:text-foreground'
                                }`}
                                title={tipItem.resolved ? 'Marcado como dominado' : 'Marcar como dominado'}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            {onRemoveTip && (
                              <button
                                onClick={() => onRemoveTip(tipId)}
                                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg"
                                title="Eliminar apunte"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {tipItem.misconceptionType && (
                          <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                            ⚠️ {tipItem.misconceptionType}
                          </div>
                        )}

                        <div className="text-sm text-foreground/90 font-medium leading-relaxed bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/60">
                          <LaTeXRenderer content={tipItem.tip} />
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </DialogContent>
          </Dialog>
        )
      })}
    </section>
  )
}
