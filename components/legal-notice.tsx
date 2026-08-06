import Link from 'next/link'

/**
 * Aviso legal compacto para los puntos donde efectivamente se recolecta el dato:
 * la pantalla de ingreso con Google y la de entrar a un aula como invitado.
 *
 * Existe aparte del `<Footer />` porque el footer sólo se monta en el layout de
 * `(app)`, y ninguna de esas dos pantallas vive ahí — son pantallas sueltas, a
 * propósito. Sin esto, un alumno menor de edad crea su sesión sin haber tenido
 * a la vista un solo link a la política que describe ese tratamiento.
 */
export function LegalNotice({
  action = 'continuar',
  className = '',
}: {
  /** Cómo se nombra el acto de consentimiento: "ingresar", "entrar al aula", … */
  action?: string
  className?: string
}) {
  return (
    <p className={`text-xs text-center text-muted-foreground leading-relaxed ${className}`}>
      Al {action} aceptás los{' '}
      <Link href="/terminos" className="underline underline-offset-2 hover:text-foreground transition-colors">
        Términos y Condiciones
      </Link>{' '}
      y la{' '}
      <Link href="/privacidad" className="underline underline-offset-2 hover:text-foreground transition-colors">
        Política de Privacidad
      </Link>
      .
    </p>
  )
}
