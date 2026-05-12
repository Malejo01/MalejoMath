import type { SubjectColorName, SubjectIconName } from '@/lib/types'

export const SUBJECT_ICON_OPTIONS: SubjectIconName[] = [
  'book-open',
  'calculator',
  'sigma',
  'chart-line',
  'flask-conical',
  'atom',
  'ruler',
  'landmark',
  'pie-chart',
  'target',
]

export const SUBJECT_COLOR_OPTIONS: SubjectColorName[] = [
  'teal',
  'blue',
  'orange',
  'green',
  'red',
  'indigo',
  'amber',
  'cyan',
  'emerald',
  'pink',
]

export const SUBJECT_COLOR_CLASS: Record<SubjectColorName, { active: string; inactive: string; chip: string }> = {
  teal: {
    active: 'bg-teal-500 text-white border-teal-500 shadow-lg shadow-teal-500/30',
    inactive: 'bg-teal-100 text-teal-700 border-teal-300 hover:border-teal-500',
    chip: 'bg-teal-500',
  },
  blue: {
    active: 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/30',
    inactive: 'bg-blue-100 text-blue-700 border-blue-300 hover:border-blue-500',
    chip: 'bg-blue-500',
  },
  orange: {
    active: 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/30',
    inactive: 'bg-orange-100 text-orange-700 border-orange-300 hover:border-orange-500',
    chip: 'bg-orange-500',
  },
  green: {
    active: 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/30',
    inactive: 'bg-green-100 text-green-700 border-green-300 hover:border-green-500',
    chip: 'bg-green-500',
  },
  red: {
    active: 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30',
    inactive: 'bg-red-100 text-red-700 border-red-300 hover:border-red-500',
    chip: 'bg-red-500',
  },
  indigo: {
    active: 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/30',
    inactive: 'bg-indigo-100 text-indigo-700 border-indigo-300 hover:border-indigo-500',
    chip: 'bg-indigo-500',
  },
  amber: {
    active: 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/30',
    inactive: 'bg-amber-100 text-amber-700 border-amber-300 hover:border-amber-500',
    chip: 'bg-amber-500',
  },
  cyan: {
    active: 'bg-cyan-500 text-white border-cyan-500 shadow-lg shadow-cyan-500/30',
    inactive: 'bg-cyan-100 text-cyan-700 border-cyan-300 hover:border-cyan-500',
    chip: 'bg-cyan-500',
  },
  emerald: {
    active: 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30',
    inactive: 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:border-emerald-500',
    chip: 'bg-emerald-500',
  },
  pink: {
    active: 'bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-500/30',
    inactive: 'bg-pink-100 text-pink-700 border-pink-300 hover:border-pink-500',
    chip: 'bg-pink-500',
  },
}
