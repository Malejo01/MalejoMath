/**
 * Single source of truth for which jurisdiction's curriculum data is the
 * default. Today only Salta's curriculum is seeded, so every reader that
 * doesn't pass an explicit jurisdiccion falls back to this. Adding a second
 * province later is a seeder run + this stays put — no code hunt required.
 *
 * Checks NEXT_PUBLIC_DEFAULT_JURISDICTION first because this constant is also
 * imported by client components (e.g. the teacher dashboard copy) — only
 * NEXT_PUBLIC_-prefixed vars get inlined into the browser bundle by Next.js.
 * Server-only code can still just set DEFAULT_JURISDICTION.
 */
export const DEFAULT_JURISDICTION =
  process.env.NEXT_PUBLIC_DEFAULT_JURISDICTION ?? process.env.DEFAULT_JURISDICTION ?? 'Salta'
