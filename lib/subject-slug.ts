const COMBINING_MARK_MIN = 0x0300
const COMBINING_MARK_MAX = 0x036f

function stripDiacritics(value: string): string {
  return Array.from(value)
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0
      return code < COMBINING_MARK_MIN || code > COMBINING_MARK_MAX
    })
    .join('')
}

export function sanitizeSubjectSegment(value: string): string {
  return stripDiacritics(value.normalize('NFD'))
    .replace(/[^a-zA-Z0-9\s_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function slugifySubject(value: string): string {
  const cleaned = sanitizeSubjectSegment(value)
  if (!cleaned) return 'sin-categoria'

  return cleaned
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
