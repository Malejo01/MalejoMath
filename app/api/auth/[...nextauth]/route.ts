import { handlers } from '@/auth'

// Exposes NextAuth's GET and POST handlers at /api/auth/[...nextauth]
// This covers: /api/auth/signin, /api/auth/signout, /api/auth/callback/google, etc.
export const { GET, POST } = handlers
