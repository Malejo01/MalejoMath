/**
 * Grado ("6to Año") is a free-text column, but it is also the join key between
 * a teacher's program and the `curriculum` table — and, from stage 2 on,
 * between a program and an aula. A teacher who types "6" instead of "6to Año"
 * silently gets an empty topic panel, which is exactly what happened to the
 * programs created before the subject wizard.
 *
 * So: canonicalize what the teacher typed, then snap it to the exact spelling
 * the curriculum uses. Never reject — an unrecognized grado (common in Nivel
 * Superior, where "3er cuatrimestre" is legitimate) is kept verbatim.
 */
/** Index = the number, e.g. ORDINALS[6] === '6to'. Matches the seeded curriculum. */
const ORDINALS = ['', '1er', '2do', '3er', '4to', '5to', '6to', '7mo'] as const

/** Keys are accent-free; input is stripped before lookup, so "séptimo" matches. */
const WORD_NUMBERS: Record<string, number> = {
  primero: 1, primer: 1, primera: 1, uno: 1,
  segundo: 2, segunda: 2, dos: 2,
  tercero: 3, tercer: 3, tercera: 3, tres: 3,
  cuarto: 4, cuarta: 4, cuatro: 4,
  quinto: 5, quinta: 5, cinco: 5,
  sexto: 6, sexta: 6, seis: 6,
  septimo: 7, septima: 7, siete: 7,
}

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/**
 * Pulls the year number out of anything a teacher might type: "6", "6to",
 * "6°", "6º año", "sexto grado", "Sexto". Returns null when there's no single
 * unambiguous number (e.g. "1er cuatrimestre 2do año" or "Ciclo básico").
 */
export function extractGradoNumber(raw: string): number | null {
  const value = stripAccents(String(raw ?? '').trim().toLowerCase())
  if (!value) return null

  const digits = value.match(/\d+/g)
  if (digits) {
    // More than one number is ambiguous — don't guess.
    if (digits.length > 1) return null
    const parsed = Number(digits[0])
    return parsed >= 1 && parsed <= 7 ? parsed : null
  }

  const matched = new Set(
    Object.entries(WORD_NUMBERS)
      .filter(([word]) => new RegExp(`\\b${word}\\b`).test(value))
      .map(([, number]) => number)
  )
  return matched.size === 1 ? [...matched][0] : null
}

/**
 * Canonical form used by the seeded curriculum: "6to Año". Returns the trimmed
 * original when the number can't be determined.
 */
export function canonicalGrado(raw: string): string {
  const trimmed = String(raw ?? '').trim()
  const number = extractGradoNumber(trimmed)
  return number ? `${ORDINALS[number]} Año` : trimmed
}
