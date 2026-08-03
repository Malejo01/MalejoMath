# Deuda técnica

Diagnóstico al **2026-08-03**, sobre `feat/ai-usage-and-db-guardrails` (commit `a285bea`).
Medido con `npx tsc --noEmit` y `npm audit`. **Nada de lo que sigue está arreglado**:
este documento es el relevamiento, no el changelog.

Versiones al momento de medir: `next@16.2.4`, `next-auth@5.0.0-beta.31`,
`postcss@8.5.14`, `typescript@5.7.3`.

---

## 3a. Errores de TypeScript ocultos por `ignoreBuildErrors`

[next.config.mjs](../next.config.mjs) tiene `typescript.ignoreBuildErrors: true`, así que
`npm run build` pasa en verde con errores de tipos adentro. El total real es **31**, no ~20:

| Archivo | Errores |
|---|---|
| `lib/moodle-export-no-imports.ts` | 14 |
| `sentry.server.config.ts` | 4 |
| `sentry.edge.config.ts` | 4 |
| `instrumentation-client.ts` | 4 |
| `app/api/curriculum/subjects/route.ts` | 1 |
| `app/api/curriculum/topics/route.ts` | 1 |
| `app/api/quiz/history/route.ts` | 1 |
| `app/api/teacher/quizzes/route.ts` | 1 |
| `components/results-screen.tsx` | 1 |

### Ruido inofensivo — 27 de 31

**`lib/moodle-export-no-imports.ts` (14 errores) — archivo muerto.**
Nada lo importa. Verificado: los tres consumidores reales
(`teacher/page.tsx`, `subject-content.tsx`, `teacher-quiz-generated.tsx`) y el test
importan `lib/moodle-export.ts`. El nombre delata el origen: es la copia que generó v0
para un sandbox que no resolvía imports, y por eso referencia `TeacherQuiz` y `Question`
sin importarlos (los 6 `TS2304`). No compila, no se ejecuta, no se testea.
Se borra con `git rm` y se llevan **14 de los 31 errores sin tocar una línea de lógica**.

**Los tres configs de Sentry (12 errores) — desajuste de tipos en el borde, sin efecto en runtime.**
`scrubEvent` está declarado `<T extends ScrubbableEvent>(event: T): T`, pero `ErrorEvent`
de Sentry no satisface `ScrubbableEvent`, así que el genérico no liga y el retorno degrada
a `ScrubbableEvent` — de ahí el `TS2322` que dice que falta la propiedad `type`.

En runtime no falta nada: `scrubEvent` **muta el evento in place y devuelve la misma
referencia** ([lib/sentry-scrub.ts:118-154](../lib/sentry-scrub.ts#L118)), así que `type`
sobrevive intacto. Los 12 tests de `lib/sentry-scrub.test.ts` cubren el comportamiento real.

Con una salvedad que lo saca de "vivir con esto": **este es el filtro de PII**. Que el
borde no typechequee significa que el compilador no está verificando el contrato entre
Sentry y el scrubber. Si un bump menor del SDK cambia la forma de `Event`, hoy no lo
avisa nadie — y el modo de falla de este módulo en particular es filtrar datos de alumnos
a un servicio externo.

**`components/results-screen.tsx` (1 error) — `canvas-confetti` sin tipos.**
`TS7016`, falta el paquete de tipos. Se resuelve con `npm i -D @types/canvas-confetti`.

### Riesgo real — 4 de 31

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

### Recomendación: ¿se puede sacar `ignoreBuildErrors`?

**Sí, y no hay nada estructural que lo impida.** Verificado empíricamente, no estimado.

| Paso | Errores que saca |
|---|---|
| `git rm lib/moodle-export-no-imports.ts` | −14 |
| Alinear `ScrubbableEvent` con los tipos de Sentry | −12 |
| Tipar las 4 filas de Neon | −4 |
| `npm i -D @types/canvas-confetti` | −1 |

El único paso no obvio es el de Sentry, y conviene saber de antemano que **no es un
one-liner**: cascadea. Lo probé en tres iteraciones y cada arreglo destapaba el siguiente
(`user.id: string` vs `string | number` → `ip_address` que puede ser `null` → `Breadcrumb`
sin index signature). La causa de fondo es que **las interfaces de TypeScript no reciben
index signature implícita**, así que cualquier tipo propio que lleve `[key: string]: unknown`
jamás va a aceptar un `Event` de Sentry, por más que las propiedades coincidan.

Lo que sí funciona son dos cambios coordinados sobre `ScrubbableEvent`: ensanchar la
nulabilidad (`id?: string | number`, `username`/`email`/`ip_address` admitiendo `null`)
**y** sacar las index signatures. Aplicando los dos juntos, `tsc` baja de **31 a 19** —
o sea, se van los 12 de Sentry de una. Verificado y revertido; los tests de
`sentry-scrub.test.ts` siguen typechequeando sin la index signature.

Dos notas de secuencia:

1. **Borrar el archivo muerto primero.** Son 14 de 31 gratis, y deja el resto legible.
2. Sacar `ignoreBuildErrors` hace que CI empiece a fallar ante cualquier error de tipos
   nuevo — que es el punto, pero conviene que aterrice cuando nadie tenga una rama larga
   abierta. Es exactamente el escenario que produjo la colisión de la migración 016.

---

## 3b. `npm audit` — 6 vulnerabilidades (4 high, 2 critical)

No se corrió `npm audit fix`.

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
- **DoS** (Server Components, Cache Components, Server Actions, Image Optimization).
  Reales pero de bajo valor para este target.
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

Todo lo que puede exponer datos de alumnos o docentes reales.

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

Nada de esto rompe hoy, pero todo apaga señales que después hacen falta.

4. **`git rm lib/moodle-export-no-imports.ts`.** 14 de 31 errores, cero riesgo.
5. **Alinear los tipos de `ScrubbableEvent`.** Los otros 12. No es cosmético: es el filtro
   de PII y hoy el compilador no está verificando su borde con Sentry.
6. **Tipar las 4 filas de Neon.** Los cuatro fallan en silencio hacia "no hay datos", que
   es el modo de falla más caro de diagnosticar.
7. **Sacar `ignoreBuildErrors`** una vez que 4–6 estén. Que aterrice sin ramas largas
   abiertas.
8. **`npm i -D @types/canvas-confetti`.** Un error, un comando.

### Vivir con esto

9. **`postcss`** — sólo build, y todo el CSS es propio. Se arregla solo con el bump de `next`.
10. **`sharp`** — camino de código muerto por `images.unoptimized: true`. **Anotar la
    condición junto a esa flag**: si se activa la optimización de imágenes, esto se
    enciende sin avisar.
11. **`vite`** — devDependency, nunca se despliega.
12. **Higiene del repo, sin urgencia**: [test-export.ts](../test-export.ts) es un script
    de debug suelto en la raíz (no lo levanta vitest, el include es `*.test.ts`), y
    `pnpm-lock.yaml` convive con `package-lock.json` estando 3 meses desactualizado —
    el proyecto usa npm (CI, `packageManager` sin declarar), así que quien corra
    `pnpm install` se lleva un árbol de dependencias viejo.
