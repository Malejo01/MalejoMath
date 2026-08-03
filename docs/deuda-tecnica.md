# Deuda técnica

Relevado el **2026-08-03** sobre `feat/ai-usage-and-db-guardrails`, actualizado en el
mismo día tras resolver la primera tanda. Medido con `npx tsc --noEmit` y `npm audit`.

Versiones al momento de medir: `next@16.2.4`, `next-auth@5.0.0-beta.31`,
`postcss@8.5.14`, `typescript@5.7.3`.

**Estado: 5 errores de TypeScript pendientes (eran 31) y 6 vulnerabilidades de npm audit,
ninguna resuelta todavía.**

---

## Ya resuelto

| Commit | Qué |
|---|---|
| `b4917c8` | `tsconfig.tsbuildinfo` fuera del control de versiones (ignorado por glob `*.tsbuildinfo`) |
| `a285bea` | Tests del fail-closed de `resolveDbTarget` |
| `cff5453` | `pnpm-lock.yaml` y `test-export.ts` borrados; `packageManager: npm@10.9.8` declarado |
| `dcaece1` | `lib/moodle-export-no-imports.ts` borrado + tipos de Sentry alineados — **31 → 5 errores** |

Detalle de lo que se cerró en `dcaece1`, porque el razonamiento sigue siendo útil:

- **`lib/moodle-export-no-imports.ts` (14 errores).** Archivo muerto: no lo importaba
  nadie. Era la copia que generó v0 para un sandbox sin resolución de imports, y por eso
  referenciaba `TeacherQuiz` y `Question` sin importarlos. Se borró entero.
- **El borde Sentry ↔ `scrubEvent` (12 errores).** Dos cambios coordinados sobre
  `ScrubbableEvent` que **sólo funcionan juntos**: sacar las index signatures y ensanchar
  la nulabilidad a la del SDK. La causa de fondo: las interfaces de TypeScript no reciben
  index signature implícita, así que un tipo propio que la exige nunca acepta un `Event`
  de Sentry por más que las propiedades coincidan. Sin cambio de comportamiento — los 12
  tests de `sentry-scrub.test.ts` pasan sin tocarse, porque `scrubEvent` muta el objeto
  original y devuelve esa misma referencia.

> Nota de medición: el documento original estimaba que esto dejaría **19** errores. Ese
> número medía sólo el arreglo de Sentry, con el archivo muerto todavía presente
> (31 − 12 = 19). Aplicando las dos cosas juntas quedan **5** (31 − 14 − 12).

---

## 3a. Errores de TypeScript ocultos por `ignoreBuildErrors`

[next.config.mjs](../next.config.mjs) sigue teniendo `typescript.ignoreBuildErrors: true`,
así que `npm run build` pasa en verde con estos 5 adentro:

| Archivo | Errores | Categoría |
|---|---|---|
| `app/api/curriculum/subjects/route.ts` | 1 | Riesgo real |
| `app/api/curriculum/topics/route.ts` | 1 | Riesgo real |
| `app/api/quiz/history/route.ts` | 1 | Riesgo real |
| `app/api/teacher/quizzes/route.ts` | 1 | Riesgo real |
| `components/results-screen.tsx` | 1 | Ruido inofensivo |

### Ruido inofensivo — 1 de 5

**`components/results-screen.tsx`** — `TS7016`, falta el paquete de tipos de
`canvas-confetti`. Se resuelve con `npm i -D @types/canvas-confetti`.

### Riesgo real — 4 de 5

Los cuatro son el mismo `TS7006`: un callback sobre filas de Neon cuyo parámetro queda
`any` implícito. El driver devuelve las filas sin forma, no hay ORM (decisión explícita,
ver CLAUDE.md), y entonces **el único lugar donde vive el contrato de shape es el string
de SQL**. TypeScript no lo puede cruzar, y `any` hace que tampoco avise.

Qué podría pasar en runtime, uno por uno:

- **[app/api/curriculum/subjects/route.ts:26](../app/api/curriculum/subjects/route.ts#L26)** —
  `rows.map((r) => r.materia)`. Si la columna o su alias cambia, el endpoint devuelve
  `[undefined, undefined, …]` y el selector de materias renderiza opciones vacías. Sin
  excepción, sin log, sin error de build: la app queda muda.
- **[app/api/curriculum/topics/route.ts:31](../app/api/curriculum/topics/route.ts#L31)** —
  `temas: r.temas as string[]`. El peor de los cuatro: es una aserción sin chequeo sobre
  una columna **JSONB**. El `as` afirma `string[]` sobre algo que la base puede devolver
  como objeto o `null`. Si eso pasa, el `.map`/`.join` de más abajo explota en el browser,
  o pinta `[object Object]` en la lista de temas. El comentario de la línea de arriba dice
  "cast for TS safety" — el cast no da seguridad, la suprime.
- **[app/api/quiz/history/route.ts:55](../app/api/quiz/history/route.ts#L55)** —
  `String(attempt.subject)`. `String(undefined)` es `"undefined"`, así que una columna
  renombrada no rompe: hace que el filtro de historial deje de matchear siempre. El alumno
  ve un historial vacío y no hay nada en los logs.
- **[app/api/teacher/quizzes/route.ts:61](../app/api/teacher/quizzes/route.ts#L61)** —
  mismo patrón sobre `quiz.mode` y `quiz.subject_name`, con el mismo desenlace del lado
  del docente.

El patrón común es que ninguno *rompe*: los cuatro degradan a "no hay datos", que es
indistinguible de un caso vacío legítimo.

### ¿Se puede sacar `ignoreBuildErrors`?

**Sí, y ya no queda nada estructural en el camino** — lo que lo hacía no trivial (el borde
de Sentry) está resuelto. Faltan dos pasos, los dos mecánicos:

| Paso | Errores que saca |
|---|---|
| Tipar las 4 filas de Neon | −4 |
| `npm i -D @types/canvas-confetti` | −1 |

Con eso `tsc --noEmit` queda en 0 y se puede borrar la flag de `next.config.mjs`.

Una sola nota de secuencia: sacar `ignoreBuildErrors` hace que CI empiece a fallar ante
cualquier error de tipos nuevo — que es el punto, pero conviene que aterrice cuando nadie
tenga una rama larga abierta. Es exactamente el escenario que produjo la colisión de la
migración 016.

---

## 3b. `npm audit` — 6 vulnerabilidades (4 high, 2 critical)

**Ninguna resuelta.** No se corrió `npm audit fix`.

### 1. `next` — **directa**, high

`16.2.4`; el fix es `16.2.12`, **bump de patch, no cambia de major**.
Arrastra ~22 advisories. Los que importan acá:

- **Bypass de middleware / proxy** (varios high: `GHSA-267c-6grr-h53f`,
  `GHSA-492v-c6pp-mqqv`, `GHSA-26hh-7cqf-hhc6`). Es *el* que hay que mirar en este
  proyecto, porque [proxy.ts](../proxy.ts) es donde vive la protección de rutas.
  **Pero hay defensa en profundidad y aguanta**: verifiqué las 15 rutas de
  `app/api/teacher/` y las 15 revalidan el rol contra la base — 8 vía `getTeacherViewer()`
  y 7 con un `requireTeacher()` local que consulta `role` en Postgres. Un bypass del
  middleware **no** le da a un alumno acceso a los endpoints de docente.
  Lo que sí queda expuesto son las **páginas** `/teacher/*`, que dependen sólo del
  middleware. Ese es el hueco real.
- **DoS** (Server Components, Cache Components, Server Actions). Reales pero de bajo valor
  para este target.
- **DoS de Image Optimization** (2 advisories) — **no aplica**: `next.config.mjs` tiene
  `images.unoptimized: true`, el pipeline no corre.

*Veredicto: parchear. Es barato (patch-level) y cierra el único hueco de autorización real.*

### 2. `next-auth` — **directa**, critical

`5.0.0-beta.31`. Rango afectado `4.24.8 - 5.0.0-beta.31`.

- **`GHSA-8fpg-xm3f-6cx3` (critical)** — un error de configuración puede dejar el objeto
  `auth` poblado con un error, y ahí **los chequeos de autenticación basados en existencia
  fallan abiertos**. Es directamente relevante: `getViewer()` hace
  `if (session?.user?.id)` ([lib/auth-session.ts:52](../lib/auth-session.ts#L52)) y las 7
  rutas con auth inline hacen `const session = await auth(); if (!userId) return 401`.
  Todos son chequeos por existencia, que es justo el patrón que el advisory describe.
  Mitiga en parte que las rutas de docente después van a la base a buscar el rol: una
  sesión fail-open sin user id válido no resuelve a `DOCENTE`. Las rutas de alumno
  dependen de `getViewer()` sola.
- **`GHSA-7rqj-j65f-68wh` (critical, homoglifos en el normalizador de email)** —
  **no aplica**: sólo afecta al provider Email. [auth.ts](../auth.ts) configura únicamente
  Google + la cookie de invitado.
- **`GHSA-xmf8-cvqr-rfgj` (high)** — `getToken()` tira excepción no capturada ante un
  header `Bearer` malformado. Vector de DoS barato si algo llama a `getToken()`.

*Veredicto: parchear, pero con smoke test manual. `fixAvailable: true` y el salto es
beta→beta dentro de 5.0.0 (no es un major), aunque los betas de next-auth rompen seguido.
Hay que probar a mano: login con Google, sesión de invitado, y el switch de rol
ALUMNO↔DOCENTE (que `getTeacherViewer()` lee de la base y no del JWT).*

### 3. `@auth/core` — **transitiva** (vía `next-auth`), critical

Mismos advisories que arriba. Se resuelve con el mismo bump; no se toca por separado.

### 4. `postcss` — **directa** (devDep `^8.5`) **y** transitiva vía `next`, high

`8.5.14`. Las tres advisories son lectura arbitraria de archivos y path traversal vía
`sourceMappingURL` en comentarios CSS, más un XSS por `</style>` sin escapar en el output.

**No explotable acá**: son rutas de *build*, y requieren CSS controlado por un atacante.
Todo el CSS del proyecto es propio (Tailwind + `globals.css`); no se procesa CSS subido
por nadie. El XSS de stringify requiere que se sirva el output de PostCSS sobre input
hostil, cosa que no pasa.

*Veredicto: viene arrastrado con el bump de `next` a 16.2.12. No amerita acción propia.*

### 5. `sharp` — **transitiva** (vía `next`), high

`<0.35.0`, CVEs heredadas de libvips (`CVE-2026-33327/33328/35590/35591`).

**No explotable en este proyecto**: `sharp` sólo lo invoca el pipeline de Image
Optimization de Next, y `next.config.mjs` lo tiene apagado con `images.unoptimized: true`.
Es código muerto en este deploy.

*Veredicto: vivir con esto — **con una condición**. El día que alguien saque
`unoptimized: true` para mejorar performance de imágenes, esta vulnerabilidad se enciende
sola y en silencio. Debería quedar anotado junto a esa flag, no sólo acá.*

### 6. `vite` — **transitiva** (vía `vitest`, devDependency), high

`8.0.0 - 8.0.15`. Bypass de `server.fs.deny` en rutas alternativas de Windows, más una
fuga de hash NTLMv2 en `launch-editor` vía rutas UNC.

**Sin exposición en producción**: `vite` sólo existe dentro del test runner. Nunca se
bundlea ni se despliega — el dev server de este proyecto es el de Next, no el de Vite.
El bypass de `fs.deny` necesita un dev server de Vite corriendo y alcanzable por el
atacante; la fuga NTLM necesita que alguien haga click en el overlay de error de Vite
desde una página hostil.

*Veredicto: vivir con esto. `fixAvailable: true`, así que se puede levantar de paso en
cualquier limpieza de dependencias, sin urgencia.*

---

## 3c. Priorización

### Arreglar antes de invitar usuarios

Todo lo que puede exponer datos de alumnos o docentes reales. **Los tres siguen abiertos.**

1. **`next` → 16.2.12.** Bump de patch. Cierra la familia de bypass de middleware. Las
   APIs de docente ya están cubiertas por revalidación de rol contra la base, pero las
   **páginas `/teacher/*` dependen sólo del middleware** y hoy quedan expuestas.
2. **`next-auth` → último 5.0.0-beta.** El fail-open de los chequeos por existencia
   (`GHSA-8fpg-xm3f-6cx3`) pega exactamente en el patrón que usa `getViewer()`. Requiere
   smoke test manual de login, invitado y switch de rol.
3. **Partir el deploy de la migración 016 en dos pasos.** Ya está documentado en
   [staging.md](staging.md#L170) pero no resuelto: las migraciones corren *después* del
   deploy, y la 016 **renombra** `ai_generation_log` → `ai_usage_log`. Deployada de una,
   hay una ventana en la que el código nuevo consulta una tabla que todavía no existe.
   Un `ADD COLUMN` tolera ese desfasaje; un rename no.

### Arreglar en el próximo sprint

4. **Tipar las 4 filas de Neon.** Los cuatro fallan en silencio hacia "no hay datos", que
   es el modo de falla más caro de diagnosticar.
5. **`npm i -D @types/canvas-confetti`.** Un error, un comando.
6. **Sacar `ignoreBuildErrors`** una vez que 4 y 5 estén. Que aterrice sin ramas largas
   abiertas.

### Vivir con esto

7. **`postcss`** — sólo build, y todo el CSS es propio. Se arregla solo con el bump de `next`.
8. **`sharp`** — camino de código muerto por `images.unoptimized: true`. **Anotar la
   condición junto a esa flag**: si se activa la optimización de imágenes, esto se
   enciende sin avisar.
9. **`vite`** — devDependency, nunca se despliega.

### Cerrado

- ~~`lib/moodle-export-no-imports.ts` muerto~~ → borrado en `dcaece1`.
- ~~Tipos del borde de Sentry~~ → alineados en `dcaece1`.
- ~~`test-export.ts` y `pnpm-lock.yaml` sueltos en la raíz~~ → borrados en `cff5453`,
  con `packageManager: npm@10.9.8` declarado para que no vuelva a haber ambigüedad de
  gestor. Ojo: CI fija Node 22 (que trae ese npm) mientras el entorno local corre Node 24
  / npm 11 — si alguna vez se habilita Corepack, esa diferencia pasa a ser un error duro.
- ~~`tsconfig.tsbuildinfo` trackeado~~ → ignorado en `b4917c8`.
