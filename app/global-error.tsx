'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

/**
 * Último recurso: sólo se muestra cuando revienta el layout raíz, es decir
 * cuando la app entera no pudo montar. Reemplaza al `<html>`, así que tiene que
 * traer sus propias etiquetas y no puede apoyarse en nada del layout.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="es">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '28rem' }}>
          <p style={{ fontSize: '3rem', margin: 0 }}>🛠️</p>
          <h1 style={{ fontSize: '1.5rem', margin: '1rem 0 0.5rem' }}>Algo se rompió de nuestro lado</h1>
          <p style={{ color: '#666', lineHeight: 1.5, margin: '0 0 1.5rem' }}>
            Ya nos llegó el aviso y lo estamos mirando. Probá recargar la página; si sigue igual,
            volvé en un rato.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.6rem 1.4rem',
              fontSize: '1rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: '#111',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Recargar
          </button>
        </div>
      </body>
    </html>
  )
}
