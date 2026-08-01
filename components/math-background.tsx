'use client'

export function MathBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--algebra-light)] via-background to-[var(--analysis-light)] opacity-60" />
      
      {/* Neutral dot-grid pattern (subject-agnostic — this background mounts on every page) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.05]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="dot-pattern"
            x="0"
            y="0"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="4" cy="4" r="1.6" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-pattern)" />
      </svg>

      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[var(--algebra)] opacity-[0.08] blur-3xl" />
      <div className="absolute top-1/3 -left-20 w-48 h-48 rounded-full bg-[var(--analysis)] opacity-[0.08] blur-3xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-[var(--probability)] opacity-[0.08] blur-3xl" />
    </div>
  )
}
