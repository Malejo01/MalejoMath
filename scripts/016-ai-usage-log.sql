-- ─── Migración 016 — Log de uso de IA (rate limiting + costo) ────────────────
--
-- La migración 015 creó `ai_generation_log` con un único propósito: contar
-- generaciones de invitados para el límite diario. Ahora la misma fila tiene
-- que responder dos preguntas distintas:
--
--   1. "¿Cuántas llamadas llevás en esta ventana?"  → rate limiting
--   2. "¿Cuánto gastamos hoy?"                      → dashboard de costo
--
-- Una sola escritura por llamada a Gemini alcanza para ambas, así que se
-- extiende la tabla existente en lugar de crear una segunda fuente de verdad.
-- El nombre pasa a `ai_usage_log` porque ya no registra sólo generación:
-- también corrección de respuestas, explicaciones y extracción de programas.

-- ─── 1. Renombre (idempotente: no-op si 016 ya se corrió) ────────────────────
ALTER TABLE IF EXISTS ai_generation_log RENAME TO ai_usage_log;

ALTER INDEX IF EXISTS idx_ai_generation_log_user_time RENAME TO idx_ai_usage_log_user_time;

-- Red de seguridad para una base fresca donde 015 no dejó la tabla.
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id         SERIAL PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. Columnas nuevas ──────────────────────────────────────────────────────
-- Los DEFAULT de este bloque describen a las filas HISTÓRICAS, que son todas
-- generaciones de quiz de invitados que terminaron bien: así quedan
-- clasificadas sin necesidad de backfill. Los tokens quedan NULL porque nunca
-- se midieron — el dashboard los muestra como costo desconocido, no como cero.
ALTER TABLE ai_usage_log
  ADD COLUMN IF NOT EXISTS endpoint           TEXT NOT NULL DEFAULT 'quiz_generation',
  ADD COLUMN IF NOT EXISTS model              TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  ADD COLUMN IF NOT EXISTS is_guest           BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS input_tokens       INTEGER,
  ADD COLUMN IF NOT EXISTS output_tokens      INTEGER,
  ADD COLUMN IF NOT EXISTS estimated_cost_usd NUMERIC(12, 6),
  ADD COLUMN IF NOT EXISTS status             TEXT NOT NULL DEFAULT 'ok';

-- Una vez backfilleado el pasado, los DEFAULT dejan de servir y pasan a ser
-- trampas: una fila nueva sin endpoint no debe hacerse pasar por generación de
-- quiz, y una sin status no debe contarse como éxito. `endpoint` queda sin
-- default (insertar sin él es un error ruidoso) y `status` arranca en
-- 'pending', que es el modo de falla seguro: cuenta contra el límite.
ALTER TABLE ai_usage_log ALTER COLUMN endpoint DROP DEFAULT;

ALTER TABLE ai_usage_log ALTER COLUMN is_guest SET DEFAULT false;

ALTER TABLE ai_usage_log ALTER COLUMN status SET DEFAULT 'pending';

-- `pending` existe porque la fila se inserta ANTES de llamar a Gemini: eso es
-- lo que cierra la ventana de carrera entre el chequeo y el consumo. Después
-- de la llamada pasa a 'ok' (con tokens) o 'error' (sin tokens, pero contando
-- igual contra el límite: un intento fallido también se factura).
ALTER TABLE ai_usage_log DROP CONSTRAINT IF EXISTS ai_usage_log_status_check;

ALTER TABLE ai_usage_log
  ADD CONSTRAINT ai_usage_log_status_check CHECK (status IN ('pending', 'ok', 'error'));

-- ─── 3. Índices ──────────────────────────────────────────────────────────────
-- El rate limiter filtra por (user_id, endpoint, ventana de tiempo).
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user_endpoint_time
  ON ai_usage_log(user_id, endpoint, created_at DESC);

-- El kill switch de presupuesto y el dashboard barren por tiempo, sin usuario.
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_time
  ON ai_usage_log(created_at DESC);

-- ─── 4. Retención ────────────────────────────────────────────────────────────
-- La tabla crece una fila por llamada a Gemini y nada la expira sola (ese es el
-- precio de no usar Redis). A este volumen tarda años en molestar; cuando haga
-- falta, la purga es un DELETE de las filas con created_at anterior a 90 días,
-- puesto como cron de Vercel. No conviene agregarlo antes de necesitarlo: hoy
-- el historial completo es justamente lo que hace útil al dashboard.
