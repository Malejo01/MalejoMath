'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Flashcard3DProps {
  front: React.ReactNode
  back: React.ReactNode
  className?: string
  flipped?: boolean
  onFlippedChange?: (flipped: boolean) => void
}

export function Flashcard3D({ front, back, className, flipped, onFlippedChange }: Flashcard3DProps) {
  const [internalFlipped, setInternalFlipped] = useState(false)
  const isFlipped = flipped ?? internalFlipped

  const toggle = () => {
    onFlippedChange?.(!isFlipped)
    if (flipped === undefined) setInternalFlipped((prev) => !prev)
  }

  return (
    <div
      className={cn('relative h-56 w-full cursor-pointer select-none', className)}
      style={{ perspective: 1000 }}
      onClick={toggle}
      role="button"
      tabIndex={0}
      aria-pressed={isFlipped}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          toggle()
        }
      }}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
          {front}
        </div>
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  )
}
