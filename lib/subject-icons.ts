import {
  Atom,
  BookOpen,
  Calculator,
  ChartLine,
  FlaskConical,
  Landmark,
  PieChart,
  Ruler,
  Sigma,
  Target,
  type LucideIcon,
} from 'lucide-react'
import type { SubjectIconName } from '@/lib/types'

/**
 * The one place that maps a stored icon name to its component. Keep in sync
 * with SUBJECT_ICON_OPTIONS in lib/subject-appearance.ts — that file lists the
 * pickable names, this one renders them.
 */
export const SUBJECT_ICON_COMPONENTS: Record<SubjectIconName, LucideIcon> = {
  'book-open': BookOpen,
  calculator: Calculator,
  sigma: Sigma,
  'chart-line': ChartLine,
  'flask-conical': FlaskConical,
  atom: Atom,
  ruler: Ruler,
  landmark: Landmark,
  'pie-chart': PieChart,
  target: Target,
}

export function subjectIconComponent(name: string | null | undefined): LucideIcon {
  return SUBJECT_ICON_COMPONENTS[(name ?? '') as SubjectIconName] ?? BookOpen
}
