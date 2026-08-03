/**
 * GET /api/admin/ai-usage
 *
 * Gasto estimado de IA, agregado por día, endpoint y modelo. Gateado por la
 * allowlist `ADMIN_EMAILS` (ver getAdminViewer): no hay rol ADMIN en el
 * producto y no se crea uno sólo para esto.
 *
 * La página `/admin/ai-usage` lee los mismos datos del lado del servidor; este
 * endpoint existe para poder consultarlos desde afuera (curl, un cron, o lo que
 * venga después) sin abrir la vista.
 */
import { NextResponse } from 'next/server'
import { getAdminViewer } from '@/lib/auth-session'
import { readAiUsageReport } from '@/lib/ai-usage'

export async function GET() {
  const admin = await getAdminViewer()
  if (!admin) {
    // 404 en vez de 403: para quien no es admin, esta ruta no existe.
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  try {
    return NextResponse.json(await readAiUsageReport())
  } catch (error) {
    console.error('[GET /api/admin/ai-usage] Error:', error)
    return NextResponse.json({ error: 'No se pudo leer el uso de IA' }, { status: 500 })
  }
}
