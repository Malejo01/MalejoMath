'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Loader2, LogIn, UserRound } from 'lucide-react'
import { isValidJoinCode, normalizeJoinCode } from '@/lib/classrooms'
import { LegalNotice } from '@/components/legal-notice'

interface ClassroomPreview {
  id: number
  name: string
  subject_name: string
  nivel: string | null
  grado: string | null
  teacher_name: string
}

/**
 * Join-by-code screen. Deliberately outside the (app) shell: a student
 * arriving from a link pasted in a class group should land on one focused
 * screen, not behind the onboarding gate.
 */
export default function JoinClassroomPage() {
  const params = useParams<{ codigo: string }>()
  const router = useRouter()
  const { data: session, status } = useSession()

  const code = normalizeJoinCode(String(params?.codigo ?? ''))

  const [preview, setPreview] = useState<ClassroomPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [guestName, setGuestName] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    if (!isValidJoinCode(code)) {
      setError('Ese código no parece válido. Tiene que tener 6 caracteres.')
      setIsLoading(false)
      return
    }

    let isMounted = true

    fetch(`/api/classrooms/join?code=${encodeURIComponent(code)}`)
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!isMounted) return
        if (!ok) {
          setError(data?.error || 'No pudimos encontrar el aula.')
          return
        }
        setPreview(data.classroom)
      })
      .catch(() => {
        if (isMounted) setError('No pudimos conectarnos. Probá de nuevo en un momento.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [code])

  const join = async (displayName?: string) => {
    setIsJoining(true)
    setError(null)

    try {
      const response = await fetch('/api/classrooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, displayName }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data?.error || 'No pudimos sumarte al aula.')
        return
      }

      router.push('/aulas')
    } catch {
      setError('No pudimos sumarte al aula. Probá de nuevo.')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-violet-500/5">
      <Card className="w-full max-w-md p-6 space-y-5 rounded-3xl border-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black leading-tight">Entrar al aula</h1>
            <p className="text-xs text-muted-foreground font-mono tracking-[0.2em]">{code || '——————'}</p>
          </div>
        </div>

        {isLoading && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Buscando el aula...
          </p>
        )}

        {!isLoading && error && !preview && (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={() => router.push('/')}>
              Volver al inicio
            </Button>
          </div>
        )}

        {preview && (
          <>
            <div className="rounded-xl border bg-muted/40 p-4 space-y-1">
              <p className="font-bold">{preview.subject_name}</p>
              <p className="text-sm text-muted-foreground">
                {preview.name}
                {preview.nivel ? ` · ${preview.nivel}` : ''}
                {preview.grado ? ` · ${preview.grado}` : ''}
              </p>
              <p className="text-xs text-muted-foreground">Docente: {preview.teacher_name}</p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {status === 'authenticated' ? (
              <Button className="w-full h-12 rounded-xl" disabled={isJoining} onClick={() => join()}>
                {isJoining ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Entrar como {session?.user?.name?.split(' ')[0] ?? 'tu cuenta'}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="guest-name" className="text-sm">
                    Entrar como invitado
                  </Label>
                  <Input
                    id="guest-name"
                    placeholder="Tu nombre y apellido"
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && guestName.trim()) join(guestName.trim())
                    }}
                  />
                  <Button
                    className="w-full h-11 rounded-xl"
                    disabled={isJoining || !guestName.trim()}
                    onClick={() => join(guestName.trim())}
                  >
                    {isJoining ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserRound className="w-4 h-4 mr-2" />}
                    Entrar sin cuenta
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Tu docente te va a ver como “sin verificar”. Podés crear tu cuenta más tarde y tu progreso te
                    sigue.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">o</span>
                  <span className="h-px flex-1 bg-border" />
                </div>

                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl"
                  onClick={() => signIn('google', { callbackUrl: `/aula/${code}` })}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Entrar con Google
                </Button>
              </div>
            )}

            <LegalNotice action="entrar al aula" className="pt-1" />
          </>
        )}
      </Card>
    </div>
  )
}
