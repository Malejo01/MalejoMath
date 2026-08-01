import { BookOpen, GraduationCap, University } from 'lucide-react'

export type Nivel = 'Primario' | 'Secundario' | 'Superior'

export const NIVEL_OPTIONS: { value: Nivel; label: string; sub: string; Icon: React.ElementType; color: string }[] = [
  {
    value: 'Primario',
    label: 'Nivel Primario',
    sub: '1er a 7mo grado',
    Icon: BookOpen,
    color: 'from-sky-500 to-blue-600',
  },
  {
    value: 'Secundario',
    label: 'Nivel Secundario',
    sub: '1er a 5to año',
    Icon: GraduationCap,
    color: 'from-violet-500 to-purple-600',
  },
  {
    value: 'Superior',
    label: 'Nivel Superior / Terciario',
    sub: 'Carrera con programa propio',
    Icon: University,
    color: 'from-emerald-500 to-teal-600',
  },
]
