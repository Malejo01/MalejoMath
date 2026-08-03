import { describe, it, expect } from 'vitest'
import { REDACTED, isSensitiveKey, redactDeep, redactUrl, scrubEvent } from '@/lib/sentry-scrub'

describe('isSensitiveKey', () => {
  it('reconoce la misma clave en cualquier convención de nombre', () => {
    for (const key of ['displayName', 'display_name', 'DISPLAY-NAME', 'displayname']) {
      expect(isSensitiveKey(key)).toBe(true)
    }
  })

  it('no filtra claves que hacen falta para diagnosticar', () => {
    for (const key of ['subject', 'topicName', 'questionCount', 'nivel', 'grado', 'status']) {
      expect(isSensitiveKey(key)).toBe(false)
    }
  })
})

describe('redactDeep', () => {
  it('filtra el nombre del invitado esté donde esté anidado', () => {
    const body = {
      codigo: 'ABC234',
      student: { name: 'Sofía', nivel: 'Primario' },
      attempts: [{ displayName: 'Sofía', score: 8 }],
    }

    expect(redactDeep(body)).toEqual({
      codigo: REDACTED,
      student: { name: REDACTED, nivel: 'Primario' },
      attempts: [{ displayName: REDACTED, score: 8 }],
    })
  })

  it('no muta el objeto original', () => {
    const body = { name: 'Sofía' }
    redactDeep(body)
    expect(body.name).toBe('Sofía')
  })

  it('conserva lo que sirve para depurar', () => {
    const body = { subject: 'Matemática', questionCount: 10, nivel: 'Secundario' }
    expect(redactDeep(body)).toEqual(body)
  })

  it('corta estructuras profundas o cíclicas sin colgarse', () => {
    const cyclic: Record<string, unknown> = { nivel: 'Primario' }
    cyclic.self = cyclic

    expect(() => redactDeep(cyclic)).not.toThrow()
    expect(JSON.stringify(redactDeep(cyclic))).toContain(REDACTED)
  })
})

describe('redactUrl', () => {
  it('borra el código de aula, que funciona como credencial', () => {
    expect(redactUrl('https://app.test/aula/ABC234')).toBe('https://app.test/aula/[codigo]')
    expect(redactUrl('/aula/ABC234/resultados')).toBe('/aula/[codigo]/resultados')
  })

  it('filtra datos personales pasados por query string', () => {
    expect(redactUrl('/api/x?nombre=Sofia&nivel=Primario')).toBe(
      `/api/x?nombre=${REDACTED}&nivel=Primario`
    )
  })
})

describe('scrubEvent', () => {
  it('deja sólo el id del usuario', () => {
    const event = scrubEvent({
      user: { id: 'uuid-123', username: 'Sofía', email: 'sofi@ejemplo.com', ip_address: '1.2.3.4' },
    })

    expect(event.user).toEqual({ id: 'uuid-123' })
  })

  it('filtra body, cookies y URL de la request', () => {
    const event = scrubEvent({
      request: {
        url: 'https://app.test/aula/ABC234',
        data: { name: 'Sofía', subject: 'Lengua' },
        cookies: { maestria_guest: 'token-firmado' },
        headers: { authorization: 'Bearer x', 'content-type': 'application/json' },
      },
    })

    expect(event.request?.url).toBe('https://app.test/aula/[codigo]')
    expect(event.request?.data).toEqual({ name: REDACTED, subject: 'Lengua' })
    expect(event.request?.cookies).toBe(REDACTED)
    expect(event.request?.headers).toEqual({
      authorization: REDACTED,
      'content-type': 'application/json',
    })
  })

  it('filtra breadcrumbs, que es por donde se cuelan las URLs de navegación', () => {
    const event = scrubEvent({
      breadcrumbs: [{ message: 'navigate to /aula/ABC234', data: { name: 'Sofía' } }],
    })

    expect(event.breadcrumbs?.[0].message).toBe('navigate to /aula/[codigo]')
    expect(event.breadcrumbs?.[0].data).toEqual({ name: REDACTED })
  })

  it('no rompe cuando el evento viene casi vacío', () => {
    expect(() => scrubEvent({})).not.toThrow()
    expect(scrubEvent({ extra: undefined })).toEqual({ extra: undefined })
  })
})
