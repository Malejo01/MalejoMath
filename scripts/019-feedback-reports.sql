-- ─── Migración 019 — Reportes de problemas de los usuarios ───────────────────
--
-- Un buzón de una sola dirección: el usuario escribe qué le pasó, la fila queda
-- acá y alguien la lee a mano. No hay notificación, ni triage automático, ni
-- respuesta al usuario — a propósito. Lo que justifica la tabla no es el texto
-- libre sino el contexto que la acompaña: sin saber en qué página estaba, con
-- qué rol y sobre qué pregunta, un "no funciona" no es accionable.

CREATE TABLE IF NOT EXISTS feedback_reports (
  id            SERIAL PRIMARY KEY,

  -- ON DELETE SET NULL, no CASCADE: el reporte tiene que sobrevivir a quien lo
  -- escribió. Un invitado se borra o se absorbe en una cuenta real
  -- (`claimed_by_user_id`) mucho antes de que alguien lea el buzón, y perder el
  -- bug junto con la fila de `users` sería exactamente el peor momento.
  -- Por eso la columna es NULLABLE, aunque el endpoint sí exige identidad.
  user_id       TEXT REFERENCES users(id) ON DELETE SET NULL,

  -- Copias desnormalizadas del viewer AL MOMENTO del reporte. Redundantes con
  -- `users` sólo en apariencia: el rol se cambia desde el navbar en cualquier
  -- momento, así que leerlo después con un JOIN contestaría "qué rol tiene hoy",
  -- que no es la pregunta. Y si `user_id` queda NULL, es lo único que queda.
  is_guest      BOOLEAN NOT NULL DEFAULT false,
  role          TEXT,

  description   TEXT NOT NULL,

  -- ─── Contexto automático ───────────────────────────────────────────────────
  -- `pathname` es la ruta del cliente. No se guarda la URL completa: los
  -- querystrings de esta app llevan códigos de aula y callbackUrl, y no hacen
  -- falta para reproducir nada.
  pathname      TEXT,

  -- Sólo se llenan si el reporte se disparó con un quiz abierto, que es el caso
  -- de uso principal del botón. Es el identificador y el tipo, NO el enunciado:
  -- el texto de la pregunta puede reconstruirse desde el quiz, y guardarlo acá
  -- convertiría al buzón en una segunda copia de contenido generado por IA sin
  -- ninguna necesidad. `question_type` viaja aparte porque es la señal que dice
  -- si el problema es del motor de un tipo puntual (el corrector de
  -- `short_answer`, el tolerance de `numeric`) y no de la pregunta en sí.
  question_id   TEXT,
  question_type TEXT,

  -- Para separar "roto en un browser" de "roto en todos". Se trunca en el
  -- endpoint; acá no hay límite duro porque no vale la pena rechazar un reporte
  -- por el largo de un header.
  user_agent    TEXT,

  -- El buzón se revisa a mano, y sin estado la única forma de saber qué ya
  -- miraste es acordarte. 'nuevo' es lo que inserta el endpoint; los otros dos
  -- los pone quien revisa, con un UPDATE.
  status        TEXT NOT NULL DEFAULT 'nuevo',

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Un reporte vacío no es un reporte. El trim va en el CHECK y no sólo en el
-- endpoint porque este es el único lugar que también cubre un INSERT a mano.
-- El techo de 4000 es contra el pegado accidental de un stack trace entero,
-- no contra el usuario: 4000 caracteres son ~600 palabras.
ALTER TABLE feedback_reports DROP CONSTRAINT IF EXISTS feedback_reports_description_check;

ALTER TABLE feedback_reports
  ADD CONSTRAINT feedback_reports_description_check
  CHECK (char_length(btrim(description)) BETWEEN 1 AND 4000);

ALTER TABLE feedback_reports DROP CONSTRAINT IF EXISTS feedback_reports_status_check;

ALTER TABLE feedback_reports
  ADD CONSTRAINT feedback_reports_status_check
  CHECK (status IN ('nuevo', 'revisado', 'descartado'));

-- La lectura real es siempre "qué hay sin revisar, lo más nuevo primero".
CREATE INDEX IF NOT EXISTS idx_feedback_reports_status_time
  ON feedback_reports(status, created_at DESC);

-- El rate limit del endpoint cuenta reportes de un usuario en la última hora.
CREATE INDEX IF NOT EXISTS idx_feedback_reports_user_time
  ON feedback_reports(user_id, created_at DESC);

-- ─── Nota para staging ───────────────────────────────────────────────────────
-- Esta tabla guarda texto libre escrito por personas reales, así que es dato
-- personal de hecho aunque no tenga una columna de email: un alumno que reporta
-- un problema escribe lo que se le ocurre, incluido su nombre o el de su
-- docente. `scripts/anonymize-staging.ts` ya borra las dos tablas equivalentes
-- (`verification_tokens` y `teacher_program_uploads`), y le falta esta —
-- queda anotado en docs/deuda-tecnica.md, sin tocar el script acá. Ver
-- docs/staging.md para el procedimiento completo de refresco de la branch.
