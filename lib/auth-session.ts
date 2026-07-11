/**
 * Shared helpers for server-side session access in API Route Handlers.
 * Import `getUserId` or `getSession` instead of calling auth() directly
 * to reduce boilerplate and keep the Clerk→NextAuth migration surface small.
 */
import { auth } from '@/auth'

/** Returns the full NextAuth session, or null if unauthenticated. */
export async function getSession() {
  return auth()
}

/** Returns the current user's stable ID (Google sub), or null. */
export async function getUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

/** Returns true if the session role is DOCENTE. */
export function isDocente(role: string | null | undefined): boolean {
  return role === 'DOCENTE'
}

/** Returns true if the session role is ALUMNO. */
export function isAlumno(role: string | null | undefined): boolean {
  return role === 'ALUMNO'
}
