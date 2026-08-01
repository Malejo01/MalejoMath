'use client'

import { Check, X } from 'lucide-react'
import { LaTeXRenderer } from '@/components/latex-renderer'
import { cn } from '@/lib/utils'
import type { MultipleChoiceQuestion } from '@/lib/types'

interface MultipleChoiceInputProps {
  question: MultipleChoiceQuestion
  selected: number | null
  submitted: boolean
  onSelect: (index: number) => void
  /** Teacher preview inline editor — when set, options render as text inputs instead. */
  editing?: boolean
  editedOptions?: string[]
  onEditOption?: (index: number, value: string) => void
  disabled?: boolean
}

export function MultipleChoiceInput({
  question,
  selected,
  submitted,
  onSelect,
  editing = false,
  editedOptions,
  onEditOption,
  disabled = false,
}: MultipleChoiceInputProps) {
  return (
    <div className="space-y-3">
      {question.options.map((option, index) => {
        const isSelected = selected === index
        const isCorrectAnswer = question.correctAnswer === index
        const showCorrect = submitted && isCorrectAnswer
        const showIncorrect = submitted && isSelected && !isCorrectAnswer
        const optionValue = editing ? (editedOptions?.[index] ?? option) : option

        return (
          <button
            key={index}
            onClick={() => onSelect(index)}
            disabled={submitted || disabled || editing}
            className={cn(
              'w-full text-left p-4 rounded-2xl border-2 transition-all duration-200',
              'touch-manipulation bg-card/80 backdrop-blur-sm',
              showIncorrect && 'animate-shake',
              disabled && !editing && 'border-border opacity-95 cursor-default',
              !disabled && !submitted && !isSelected && 'border-border hover:border-[var(--algebra)]/50 hover:shadow-md active:scale-[0.98]',
              !disabled && !submitted && isSelected && 'border-[var(--algebra)] bg-[var(--algebra-light)] shadow-lg shadow-[var(--algebra)]/20',
              showCorrect && 'border-[var(--analysis)] bg-[var(--analysis-light)] shadow-lg shadow-[var(--analysis)]/20 border-4',
              showIncorrect && 'border-destructive bg-destructive/10 shadow-lg shadow-destructive/20 border-4',
              !disabled && submitted && !showCorrect && !showIncorrect && 'border-border opacity-40'
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-lg font-bold transition-all border-2',
                !submitted && !isSelected && 'bg-muted text-muted-foreground border-transparent',
                !submitted && isSelected && 'bg-[var(--algebra)] text-white border-[var(--algebra)]',
                showCorrect && 'bg-[var(--analysis)] text-white border-[var(--analysis)]',
                showIncorrect && 'bg-destructive text-white border-destructive'
              )}>
                {submitted ? (
                  showCorrect ? <Check className="w-6 h-6" strokeWidth={3} /> :
                  showIncorrect ? <X className="w-6 h-6" strokeWidth={3} /> :
                  String.fromCharCode(65 + index)
                ) : (
                  String.fromCharCode(65 + index)
                )}
              </div>
              <span className="flex-1 min-w-0 pt-2.5 font-semibold text-base break-words overflow-x-auto max-w-full">
                {!editing ? (
                  <LaTeXRenderer content={optionValue} className="text-foreground" />
                ) : (
                  <input
                    value={optionValue}
                    onChange={(event) => onEditOption?.(index, event.target.value)}
                    className="w-full border rounded-md px-2 py-1 bg-background text-sm"
                  />
                )}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
