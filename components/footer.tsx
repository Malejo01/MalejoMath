import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export function Footer() {
  return (
    <footer className="w-full py-6 md:py-8 mt-auto border-t bg-background/50 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <p className="text-sm text-muted-foreground font-medium">
            © {new Date().getFullYear()} MaestrIA. Todos los derechos reservados.
          </p>
        </div>
        <nav className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/terminos"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Términos y Condiciones
          </Link>
          <Link
            href="/privacidad"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Política de Privacidad
          </Link>
        </nav>
      </div>
    </footer>
  )
}
