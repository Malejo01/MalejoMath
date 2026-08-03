-- ─── Migración 017 — Marcador de entorno (guardrail de migraciones) ──────────
--
-- Hasta acá, todo script de escritura (`run-migration-*.ts`, los backfill y los
-- repair) hacía `dotenv.config({ path: '.env.local' })` y tomaba DATABASE_URL.
-- Es decir: no existía forma de correr uno contra algo que no fuera producción,
-- y tampoco forma de darse cuenta. `fix-tutoria-grades.ts` hace
-- `DELETE FROM curriculum` — ese es el escenario que esta tabla previene.
--
-- La alternativa era hardcodear el hostname de producción en el repo. Se
-- descartó: el endpoint de Neon cambia (al restaurar desde un backup cambia
-- sí o sí), y un guardrail que apunta a un host viejo deja de proteger sin
-- avisar. El marcador vive en la base, así que viaja con ella.
--
-- ─── Por qué el default es 'production' ──────────────────────────────────────
-- Una branch de Neon es una copia copy-on-write: al crear `staging` desde
-- producción, esta tabla se clona con su fila intacta, diciendo 'production'.
-- Entonces la branch recién creada se HACE PASAR por producción hasta que
-- alguien la marca a mano (lo hace `anonymize-staging.ts` al terminar).
--
-- Eso es a propósito. Si el paso se olvida, el error es "staging pide una
-- confirmación que no hacía falta", no "un script destructivo corrió contra
-- producción creyendo que era staging". Falla cerrado.

CREATE TABLE IF NOT EXISTS deployment_env (
  -- Truco de una-sola-fila: la PK sólo admite el valor `true`, así que un
  -- segundo INSERT choca contra la PK en vez de crear un marcador ambiguo.
  -- Con dos filas, "¿qué entorno es este?" no tendría respuesta y el guardrail
  -- no sabría a cuál obedecer.
  id          BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  environment TEXT NOT NULL CHECK (environment IN ('production', 'staging', 'development')),

  -- Host del endpoint donde ESTA fila se escribió por primera vez, puesto por
  -- run-migration-017.ts (el SQL no puede saberlo solo).
  --
  -- Resuelve la ambigüedad que deja el default de arriba: una branch recién
  -- clonada y la producción real dicen las dos 'production', pero se conectan
  -- por hosts distintos. Comparar el host actual contra este campo separa los
  -- dos casos sin que nadie tenga que acordarse de nada:
  --
  --   environment='production' Y origin_host = host actual  → producción REAL
  --   environment='production' Y origin_host ≠ host actual  → clon sin flipear
  --
  -- Es lo que habilita a `anonymize-staging.ts` a negarse en redondo a correr
  -- contra producción, en vez de depender de que el operador haya marcado bien
  -- la branch antes de anonimizarla — que es exactamente el paso que se olvida.
  origin_host TEXT,

  -- Nota libre para humanos: de qué branch de Neon salió, cuándo, para qué.
  -- No la lee ningún script; la lee quien esté debuggeando a las 3 AM.
  note        TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ON CONFLICT DO NOTHING para que re-correr la migración no pise un marcador
-- ya flipeado a 'staging' — eso volvería a etiquetar staging como producción
-- y rompería la anonimización que ya se hizo.
INSERT INTO deployment_env (id, environment, note)
VALUES (true, 'production', 'Marcador inicial creado por la migración 017.')
ON CONFLICT (id) DO NOTHING;
