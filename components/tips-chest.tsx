'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Flashcard3D } from '@/components/flashcard-3d'
import { LaTeXRenderer } from './latex-renderer'
import { Lightbulb, Sparkles, BookOpen, ChevronRight, RotateCw } from 'lucide-react'
import type { StudentTip } from '@/lib/types'

interface TipsChestProps {
  tips: StudentTip[]
  /** When set, renders a compact "sneak peek" header with a link to the full /tips view. */
  limit?: number
}

export function TipsChest({ tips, limit }: TipsChestProps) {
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

  const visibleTips = limit ? tips.slice(0, limit) : tips

  return (
    <section className="space-y-4">
      {limit && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4 fill-white" />
            </div>
            <h3 className="font-bold text-foreground text-lg">Mis Apuntes e Ideas Clave</h3>
          </div>
          <Link href="/tips" className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:translate-x-0.5 transition-transform shrink-0">
            Ver todos
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
        {visibleTips.map((tipItem, idx) => {
          const tipId = tipItem.id ?? `tip-${idx}`
          return (
            <Flashcard3D
              key={tipId}
              front={
                <Card className="h-full w-full p-5 flex flex-col justify-between border-2 border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-yellow-50/50 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <RotateCw className="w-4 h-4 text-amber-500/50" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider capitalize">
                      {tipItem.subject || 'General'}
                    </p>
                    <h4 className="font-bold text-foreground leading-snug mt-0.5">{tipItem.topicName}</h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">Toca para ver el tip</p>
                </Card>
              }
              back={
                <Card className="h-full w-full p-5 flex flex-col justify-between border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-2xl overflow-y-auto">
                  <div className="space-y-2">
                    {tipItem.misconceptionType && (
                      <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                        ⚠️ {tipItem.misconceptionType}
                      </div>
                    )}
                    <div className="text-sm text-foreground/90 font-medium leading-relaxed">
                      <LaTeXRenderer content={tipItem.tip} />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">Toca para volver</p>
                </Card>
              }
            />
          )
        })}
      </div>
    </section>
  )
}
