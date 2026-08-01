import { describe, it, expect } from 'vitest'
import { canonicalGrado, extractGradoNumber } from '@/lib/grado'

describe('extractGradoNumber', () => {
  it('reads plain digits', () => {
    expect(extractGradoNumber('6')).toBe(6)
    expect(extractGradoNumber('1')).toBe(1)
  })

  it('reads the ordinal forms teachers actually type', () => {
    expect(extractGradoNumber('6to')).toBe(6)
    expect(extractGradoNumber('6to Año')).toBe(6)
    expect(extractGradoNumber('6°')).toBe(6)
    expect(extractGradoNumber('6º año')).toBe(6)
    expect(extractGradoNumber('1ero')).toBe(1)
    expect(extractGradoNumber('3er Año')).toBe(3)
  })

  it('reads spelled-out numbers, with or without accents', () => {
    expect(extractGradoNumber('sexto')).toBe(6)
    expect(extractGradoNumber('Sexto grado')).toBe(6)
    expect(extractGradoNumber('séptimo año')).toBe(7)
    expect(extractGradoNumber('septimo')).toBe(7)
    expect(extractGradoNumber('primero')).toBe(1)
    expect(extractGradoNumber('primer año')).toBe(1)
  })

  it('refuses to guess when the text is ambiguous or out of range', () => {
    expect(extractGradoNumber('1er cuatrimestre 2do año')).toBeNull()
    expect(extractGradoNumber('Ciclo básico')).toBeNull()
    expect(extractGradoNumber('')).toBeNull()
    expect(extractGradoNumber('9')).toBeNull()
    expect(extractGradoNumber('2024')).toBeNull()
  })
})

describe('canonicalGrado', () => {
  it('snaps every spelling of the same year to one string', () => {
    const expected = '6to Año'
    for (const input of ['6', '6to', '6°', '6º año', 'sexto', 'Sexto Grado', '6TO AÑO']) {
      expect(canonicalGrado(input)).toBe(expected)
    }
  })

  it('produces the exact ordinals the seeded curriculum uses', () => {
    expect(canonicalGrado('1')).toBe('1er Año')
    expect(canonicalGrado('2')).toBe('2do Año')
    expect(canonicalGrado('3')).toBe('3er Año')
    expect(canonicalGrado('4')).toBe('4to Año')
    expect(canonicalGrado('5')).toBe('5to Año')
    expect(canonicalGrado('7')).toBe('7mo Año')
  })

  it('keeps text it cannot parse, so Nivel Superior stays free-form', () => {
    expect(canonicalGrado('3er cuatrimestre 2do tramo')).toBe('3er cuatrimestre 2do tramo')
    expect(canonicalGrado('Ciclo de especialización')).toBe('Ciclo de especialización')
    expect(canonicalGrado('  ')).toBe('')
  })
})
