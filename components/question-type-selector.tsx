'use client'

import { cn } from '@/lib/utils'
import { QUESTION_TYPE_OPTIONS } from '@/lib/question-types'
import type { QuestionType } from '@/lib/types'

interface QuestionTypeSelectorProps {
  value: QuestionType[]
  onChange: (next: QuestionType[]) => void
  disabled?: boolean
  className?: string
}

/**
 * Multi-select chips for which question types the generator may use.
 * Always keeps at least one type selected — an empty selection would
 * silently fall back to multiple_choice server-side, which is confusing
 * when the checkboxes on screen show nothing checked.
 */
export function QuestionTypeSelector({ value, onChange, disabled = false, className }: QuestionTypeSelectorProps) {
  const toggle = (type: QuestionType) => {
    if (disabled) return

    if (value.includes(type)) {
      if (value.length === 1) return
      onChange(value.filter((t) => t !== type))
    } else {
      onChange([...value, type])
    }
  }

  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      {QUESTION_TYPE_OPTIONS.map(({ value: type, label, description, Icon }) => {
        const isSelected = value.includes(type)
        return (
          <button
            key={type}
            type="button"
            disabled={disabled}
            onClick={() => toggle(type)}
            aria-pressed={isSelected}
            className={cn(
              'flex items-start gap-2 rounded-xl border p-3 text-left transition-all disabled:opacity-50 disabled:pointer-events-none',
              isSelected
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground hover:border-primary/50'
            )}
          >
            <Icon className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-tight">{label}</span>
              <span className="block text-xs opacity-80 leading-snug">{description}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
