import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Migrations are numbered by hand and applied by hand, so nothing but this test
 * stops two branches from both claiming the next number. Two files called 016
 * merge cleanly in git and then silently diverge: whoever runs them second gets
 * a schema nobody else has, and the mistake only surfaces in production.
 */
const SCRIPTS_DIR = join(process.cwd(), 'scripts')
const FILES = readdirSync(SCRIPTS_DIR)

/**
 * 012 was never authored — the number was skipped, not lost. Listing it here
 * keeps the gap check meaningful: a NEW skip (someone jumping 018 → 020) fails,
 * while the one piece of accepted history stays quiet.
 */
const KNOWN_GAPS = [12]

interface Numbered {
  file: string
  number: number
}

function collect(pattern: RegExp): Numbered[] {
  return FILES.map((file) => {
    const match = pattern.exec(file)
    return match ? { file, number: Number.parseInt(match[1], 10) } : null
  })
    .filter((entry): entry is Numbered => entry !== null)
    .sort((a, b) => a.number - b.number)
}

function duplicates(entries: Numbered[]): string[] {
  const byNumber = new Map<number, string[]>()
  for (const entry of entries) {
    byNumber.set(entry.number, [...(byNumber.get(entry.number) ?? []), entry.file])
  }
  return [...byNumber.entries()]
    .filter(([, files]) => files.length > 1)
    .map(([number, files]) => `${String(number).padStart(3, '0')}: ${files.join(', ')}`)
}

const sqlFiles = collect(/^(\d{3})-.*\.sql$/)
const runners = collect(/^run-migration-(\d{3})\.ts$/)

describe('numeración de migraciones', () => {
  it('encuentra las migraciones', () => {
    expect(sqlFiles.length).toBeGreaterThan(0)
    expect(runners.length).toBeGreaterThan(0)
  })

  it('no tiene dos archivos .sql con el mismo número', () => {
    expect(duplicates(sqlFiles)).toEqual([])
  })

  it('no tiene dos runners con el mismo número', () => {
    expect(duplicates(runners)).toEqual([])
  })

  it('no saltea números sin declararlo', () => {
    // Un número está tomado si lo reclama un .sql O un runner. La 018 no tiene
    // archivo .sql porque no es DDL: normaliza `origin_host` y todo su SQL vive
    // en el runner. Mirando sólo los .sql aparecía como hueco, que es lo
    // contrario de lo que pasa — el número está ocupado, y declararlo libre
    // invitaría a que una rama futura lo reutilice, que es exactamente el
    // choque que este archivo existe para evitar.
    const present = new Set([...sqlFiles, ...runners].map((entry) => entry.number))
    const highest = Math.max(...present)
    const gaps: number[] = []

    for (let n = 1; n <= highest; n += 1) {
      if (!present.has(n) && !KNOWN_GAPS.includes(n)) gaps.push(n)
    }

    expect(gaps).toEqual([])
  })
})

describe('runners de migración', () => {
  // Runners 009-011 embed their SQL as tagged templates; 013+ read a .sql file.
  // Only the second kind can dangle, so the check is driven by what the source
  // actually references rather than by the numbering convention. Asserting the
  // reverse (every .sql needs a runner) would be wrong: 001-008 predate the
  // runners and were applied by hand.
  it.each(runners.map((runner) => runner.file))('%s referencia archivos .sql que existen', (file) => {
    const source = readFileSync(join(SCRIPTS_DIR, file), 'utf8')
    const referenced = [...source.matchAll(/'(\d{3}-[a-z0-9-]+\.sql)'/g)].map((match) => match[1])

    for (const name of referenced) {
      expect(FILES, `${file} lee ${name}, que no existe`).toContain(name)
    }
  })
})
