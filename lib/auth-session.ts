/**
 * Shared helpers for server-side session access in API Route Handlers.
 * Import `getUserId` or `getSession` instead of calling auth() directly
 * to reduce boilerplate and keep the Clerk→NextAuth migration surface small.
 */
import { cookies } from 'next/headers'
import { auth } from '@/auth'
import { sql } from '@/lib/db'
import { GUEST_COOKIE_NAME, verifyGuestToken } from '@/lib/guest-session'
import type { UserRole } from '@/lib/types'

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

/**
 * Whoever is making the request: a signed-in Google user or a guest student
 * who joined an aula by code. Both map to a row in `users`, so callers can
 * write quiz_attempts, memberships and tips without branching — the only
 * differences that matter downstream are the AI rate limit and the
 * "sin verificar" badge on the teacher's roster.
 */
export interface Viewer {
  id: string
  role: UserRole | null
  isGuest: boolean
  displayName: string
}

export async function getViewer(): Promise<Viewer | null> {
  const session = await auth()
  if (session?.user?.id) {
    return {
      id: session.user.id,
      role: session.user.role ?? null,
      isGuest: false,
      displayName: session.user.name ?? '',
    }
  }

  const cookieStore = await cookies()
  const guestId = await verifyGuestToken(cookieStore.get(GUEST_COOKIE_NAME)?.value)
  if (!guestId) return null

  // A valid signature isn't enough: the row may have been deleted, or already
  // absorbed into a real account (claimed_by_user_id), in which case the guest
  // identity is retired and the student continues as their signed-in self.
  const rows = (await sql`
    SELECT id, name, claimed_by_user_id
    FROM users
    WHERE id = ${guestId} AND is_guest = true
    LIMIT 1
  `) as { id: string; name: string | null; claimed_by_user_id: string | null }[]

  const guest = rows[0]
  if (!guest || guest.claimed_by_user_id) return null

  return { id: guest.id, role: 'ALUMNO', isGuest: true, displayName: guest.name ?? 'Invitado' }
}

/**
 * Viewer restricted to teachers. Re-reads the role from the DB because the JWT
 * caches it — a teacher who just switched roles shouldn't have to sign out.
 */
export async function getTeacherViewer(): Promise<Viewer | null> {
  const viewer = await getViewer()
  if (!viewer || viewer.isGuest) return null

  const rows = (await sql`
    SELECT COALESCE(role, 'ALUMNO') AS role FROM users WHERE id = ${viewer.id} LIMIT 1
  `) as { role: string }[]

  return isDocente(rows[0]?.role) ? { ...viewer, role: 'DOCENTE' } : null
}
