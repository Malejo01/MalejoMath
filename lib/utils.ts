import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function debugLog(message: string, ...args: any[]) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(message, ...args)
  }
}
