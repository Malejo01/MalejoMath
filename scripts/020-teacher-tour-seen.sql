-- ─── Migración 020 — Marca de "ya vio el tour del docente" ───────────────────
--
-- El tour de bienvenida del panel docente se marcaba como visto en
-- `localStorage`, lo que rompía de dos maneras a la vez:
--
--   1. Se escribía al ABRIR el modal, no al terminarlo. Un docente que cerraba
--      sin querer, o que recargaba la página, no lo veía nunca más — y el tour
--      es lo único que explica los tres caminos para armar una materia.
--   2. `localStorage` es por navegador. El mismo docente lo volvía a ver en la
--      compu de la escuela después de haberlo completado en su casa, y nunca
--      más en la de su casa. Exactamente al revés de lo que uno querría.
--
-- Una columna nullable en `users` arregla los dos: es por cuenta, y la escribe
-- el servidor recién cuando el docente cierra el tour por decisión propia.
--
-- Es TIMESTAMPTZ y no BOOLEAN porque el dato interesante no es "lo vio" sino
-- "cuándo": si dentro de tres meses hay que rehacer el tour, saber quiénes lo
-- vieron antes de esa fecha es lo que permite volver a mostrárselo sin
-- pisárselo a todos. Un booleano tira esa información y no se recupera.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS teacher_tour_seen_at TIMESTAMPTZ;

-- ─── Nota sobre invitados ────────────────────────────────────────────────────
-- La columna vive en `users`, que también contiene las filas de invitados
-- (`is_guest = true`). Para ellos queda siempre en NULL: el tour es del panel
-- docente y un invitado no puede llegar ahí. No hace falta constraint — el
-- endpoint que la escribe pasa por `getTeacherViewer()`, que ya excluye
-- invitados y relee el rol desde la base.
