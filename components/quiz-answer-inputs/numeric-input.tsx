'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { NumericQuestion } from '@/lib/types'

interface NumericInputProps {
  question: NumericQuestion
  value: number | null
  submitted: boolean
  onChange: (value: number | null) => void
  isCorrect?: boolean | null
  disabled?: boolean
}

export function NumericInput({ question, value, submitted, onChange, isCorrect, disabled = false }: NumericInputProps) {
  return (
    <div className="space-y-3">
      <input
        type="number"
        inputMode="decimal"
        value={value ?? ''}
        onChange={(event) => {
          const raw = event.target.value
          onChange(raw === '' ? null : Number(raw))
        }}
        disabled={submitted || disabled}
        placeholder="Escribe tu respuesta numérica"
        className={cn(
          'w-full p-4 rounded-2xl border-2 bg-card/80 backdrop-blur-sm text-lg font-bold text-center transition-all',
          'focus:outline-none focus:ring-2 focus:ring-[var(--algebra)]/40',
          !submitted && 'border-border focus:border-[var(--algebra)]',
          submitted && isCorrect && 'border-[var(--analysis)] bg-[var(--analysis-light)] border-4',
          submitted && isCorrect === false && 'border-destructive bg-destructive/10 border-4'
        )}
      />
      {submitted && isCorrect === false && (
        <Card className="p-3 rounded-xl border border-[var(--analysis)]/30 bg-[var(--analysis-light)] text-center">
          <span className="text-sm font-semibold text-[var(--analysis)]">
            Respuesta correcta: {question.correctAnswer}
            {question.tolerance ? ` (± ${question.tolerance})` : ''}
          </span>
        </Card>
      )}
    </div>
  )
}
