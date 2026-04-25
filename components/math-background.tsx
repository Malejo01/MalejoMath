'use client'

export function MathBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--algebra-light)] via-background to-[var(--analysis-light)] opacity-60" />
      
      {/* Math symbols pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.04]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="math-pattern"
            x="0"
            y="0"
            width="120"
            height="120"
            patternUnits="userSpaceOnUse"
          >
            {/* Integral */}
            <text x="10" y="30" fontSize="24" fill="currentColor" fontFamily="serif">&#8747;</text>
            {/* Sum */}
            <text x="70" y="35" fontSize="20" fill="currentColor" fontFamily="serif">&#8721;</text>
            {/* Pi */}
            <text x="45" y="70" fontSize="22" fill="currentColor" fontFamily="serif">&#960;</text>
            {/* Square root */}
            <text x="90" y="80" fontSize="18" fill="currentColor" fontFamily="serif">&#8730;</text>
            {/* Infinity */}
            <text x="15" y="100" fontSize="20" fill="currentColor" fontFamily="serif">&#8734;</text>
            {/* Delta */}
            <text x="60" y="110" fontSize="18" fill="currentColor" fontFamily="serif">&#916;</text>
            {/* Plus minus */}
            <text x="100" y="25" fontSize="16" fill="currentColor" fontFamily="serif">&#177;</text>
            {/* Partial derivative */}
            <text x="5" y="60" fontSize="18" fill="currentColor" fontFamily="serif">&#8706;</text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#math-pattern)" />
      </svg>

      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[var(--algebra)] opacity-[0.08] blur-3xl" />
      <div className="absolute top-1/3 -left-20 w-48 h-48 rounded-full bg-[var(--analysis)] opacity-[0.08] blur-3xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-[var(--probability)] opacity-[0.08] blur-3xl" />
    </div>
  )
}
