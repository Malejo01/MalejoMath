# Deuda técnica

Relevado el **2026-08-03** sobre `feat/ai-usage-and-db-guardrails`, actualizado el mismo
día a medida que se fue cerrando. Ampliado el **2026-08-04** sobre
`feature/feedback-y-limpieza` con el relevamiento de ESLint (sección 4).
Medido con `npx tsc --noEmit`, `npm audit` y `npm run lint`.

Versiones al momento de medir: `next@16.2.4`, `next-auth@5.0.0-beta.31`,
`postcss@8.5.14`, `typescript@5.7.3`, `eslint@9`, `eslint-config-next@16.2.4`.

**Estado: TypeScript en 0 errores y `ignoreBuildErrors` fuera. ESLint instalado y en
verde, con 93 warnings de código preexistente inventariados y sin arreglar. Quedan las 6
vulnerabilidades de `npm audit`, ninguna resuelta.**

---

## Ya resuelto

| Commit | Qué |
|---|---|
| `b4917c8` | `tsconfig.tsbuildinfo` fuera del control de versiones (ignorado por glob `*.tsbuildinfo`) |
| `a285bea` | Tests del fail-closed de `resolveDbTarget` |
| `cff5453` | `pnpm-lock.yaml` y `test-export.ts` borrados; `packageManager: npm@10.9.8` declarado |
| `dcaece1` | `lib/moodle-export-no-imports.ts` borrado + tipos de Sentry alineados — **31 → 5 errores** |
| *(este)* | 4 filas de Neon tipadas + `@types/canvas-confetti` + `ignoreBuildErrors` fuera — **5 → 0** |

---

## 3a. Errores de TypeScript — **resuelto**

`typescript.ignoreBuildErrors` ya no está en [next.config.mjs](../next.config.mjs), así que
**`npm run build` typechequea de verdad**: un error de tipos ahora rompe el build y, por
lo tanto, CI. Verificado inyectando un error deliberado — el build sale con código 1 y
`Type error:` en la salida, no en verde.

Cómo se cerraron los 31:

| Origen | Errores | Cómo se resolvió |
|---|---|---|
| `lib/moodle-export-no-imports.ts` | 14 | Archivo muerto, borrado (`dcaece1`) |
| Borde Sentry ↔ `scrubEvent` | 12 | `ScrubbableEvent` alineado con el SDK (`dcaece1`) |
| Filas de Neon con `any` implícito | 4 | Tipadas con el shape real de cada query |
| `canvas-confetti` sin tipos | 1 | `npm i -D @types/canvas-confetti` |

### Las 4 filas de Neon

El problema de fondo era que el driver devuelve las filas sin forma, no hay ORM (decisión
explícita, ver CLAUDE.md), y entonces **el único lugar donde vivía el contrato de shape era
el string de SQL**. Ninguno de los cuatro rompía: los cuatro degradaban en silencio a "no
hay datos", indistinguible de un caso vacío legítimo.

Cada query declara ahora una interfaz con las columnas que realmente selecciona, y con un
comentario que apunta al `.sql` donde está el DDL. No se usó un tipo laxo genérico: donde
el schema no garantiza una forma, el tipo lo dice.

Tres decisiones que vale la pena recordar, porque no son obvias:

- **`curriculum.temas` es JSONB → `unknown`, no `string[]`.** Postgres garantiza JSON
  válido, no un arreglo de strings. El `as string[]` que había (comentado como *"cast for
  TS safety"*) no daba seguridad: la suprimía. Ahora la columna se estrecha con un guard
  (`toTopicList`) que descarta lo que no sea `string[]` en el servidor, donde se puede ver,
  en vez de dejarlo llegar al browser a romper el `.map`/`.join`.
  **Es el único cambio de comportamiento de la tanda**: datos malformados ahora devuelven
  lista vacía en lugar de romper del lado del cliente.
- **`quiz_attempts.score` es DECIMAL(4,2) → `string`.** El driver devuelve los `numeric`
  como string para no perder precisión. No es una elección de estilo: es la razón por la
  que todos los consumidores ya lo envolvían en `Number(...)`.
- **`completed_at` / `created_at` son `Date | null`.** En el schema sólo tienen
  `DEFAULT NOW()`, sin `NOT NULL`. Los call sites usan `?? 0`, que conserva exactamente el
  comportamiento previo (`new Date(null)` ya era la época).

### Pendiente menor relacionado

`lib/db.ts` declara `DbQuizAttempt`, `DbTeacherQuiz` y `DbTopicMastery`, y **no los importa
nadie**. Además no coinciden con el schema: `DbQuizAttempt.id` dice `string` cuando la
columna es `SERIAL`, le faltan `incorrect_answers` y `passed`, y tipa `score` como `number`.
Por eso no se reutilizaron acá — habría sido adoptar tipos ya equivocados. Conviene
borrarlos o corregirlos, pero al no estar en uso no rompen nada hoy.

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
Es código muerto en este deploy. La condición quedó anotada en un comentario **junto a la
flag misma**, que es donde alguien la va a leer antes de cambiarla.

*Veredicto: vivir con esto, con esa condición.*

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

## 4. ESLint — instalado el 2026-08-04, **93 warnings de código preexistente**

`npm run lint` venía fallando desde antes porque **ESLint no estaba instalado**: el script
decía `eslint .` y no había binario. No era una regla rota, era la herramienta ausente.

Se instaló `eslint@9` + `eslint-config-next@16.2.4`, pineado a la misma versión que `next`.
Desde la 16 ese paquete exporta configs planas directas, así que
[eslint.config.mjs](../eslint.config.mjs) no necesita `FlatCompat` ni `@eslint/eslintrc`; los
presets `core-web-vitals` y `typescript` ya traen typescript-eslint, react, react-hooks 7,
jsx-a11y e import. `next lint` está deprecado desde la 15 y no se usa.

La primera corrida dio **79 errores y 16 warnings**. Ninguno se arregló: se relevaron, se
clasificaron acá, y las cuatro reglas que producían errores se bajaron a `warn`.

**Por qué `warn` y no `off`.** `off` borra el hallazgo del reporte, y entonces nada distingue
"no lo arreglamos todavía" de "no existe". `warn` deja el lint en verde — ESLint sólo falla
por errores — y a la vez mantiene el inventario a la vista. Cada regla vuelve a `error` en
cuanto su bloque llegue a cero; el comentario que dice eso está al lado de cada una en la
config, no sólo acá.

**Esto no pone en verde nada que estuviera en rojo en CI**: [ci.yml](../.github/workflows/ci.yml)
corre `npm test` y `npm run build`, **no** el lint. La consecuencia de bajar a `warn` es
enteramente local. Que el lint no esté en CI es, por otro lado, su propia deuda — no tiene
sentido meterlo mientras haya 93 warnings, porque el paso pasaría siempre.

### Clasificación

| Regla | Cant. | Qué es | Riesgo real | Costo |
|---|---|---|---|---|
| `@typescript-eslint/no-explicit-any` | 52 | Tipos escapados a `any` | **Medio** | Alto |
| `react-hooks/set-state-in-effect` | 22 | `setState` dentro de `useEffect` | **Bajo-medio** | Medio |
| `@typescript-eslint/no-unused-vars` | 14 | Imports y bindings muertos | Ninguno | Trivial |
| `prefer-const` | 2 | `let` que nunca se reasigna | Ninguno | Trivial (autofix) |
| `@next/next/no-assign-module-variable` | 2 | Variable local llamada `module` | Bajo | Trivial |
| `@next/next/no-img-element` | 1 | `<img>` en vez de `next/image` | Ninguno acá | Ninguno |
| `react-hooks/purity` | 1 | `Math.random()` en render | Ninguno | No se toca |

### 4a. `no-explicit-any` — 52, el bloque grande

Concentración real, no disperso:

| Archivo | Cant. |
|---|---|
| `app/api/generate-quiz/route.ts` | 18 |
| `app/api/teacher/classrooms/[id]/report/route.ts` | 8 |
| `lib/ai-usage.ts` | 5 |
| `app/api/teacher/classrooms/[id]/students/[userId]/route.ts` | 4 |
| `app/(app)/teacher/page.tsx`, `app/api/student/classrooms/route.ts`, `lib/classrooms-server.ts`, `lib/db.ts` | 2 c/u |
| 9 archivos más | 1 c/u |

**Es la contracara de no tener ORM**, que es una decisión explícita (ver CLAUDE.md): el
driver de Neon devuelve las filas sin forma y `any` es el atajo. O sea que es exactamente el
mismo problema que ya se cerró a mano para cuatro queries en la sección 3a — y ahí quedó
documentado por qué importa: los cuatro **degradaban en silencio a "no hay datos"**,
indistinguible de un caso vacío legítimo.

Por eso el riesgo es medio y no cosmético: cada `any` sobre una fila de Postgres es un
contrato de shape que vive únicamente en el string de SQL. Pero el costo también es alto —
el arreglo correcto es declarar una interfaz por query, no un `Record<string, unknown>`
genérico, que suprimiría el problema igual que el `any`.

Dos de los 52 son distintos y hay que mirarlos aparte: los de `lib/db.ts` están en el
`sql` lazy (`let lazySql: any`), donde el `any` es el tipo del cliente de Neon y no de una
fila. Ese se arregla importando el tipo del driver, no escribiendo una interfaz.

### 4b. `react-hooks/set-state-in-effect` — 22, regla nueva

`eslint-plugin-react-hooks@7` la agregó; **no existía cuando se escribió este código**, así
que no es que alguien la ignoró.

| Archivo | Cant. |
|---|---|
| `components/teacher-subject-wizard.tsx` | 5 |
| `components/explanation-modal.tsx`, `components/teacher-classrooms.tsx` | 2 c/u |
| 13 archivos más (páginas de aulas/teacher, navbar, quiz-overlay, curriculum-selector, `use-mobile`…) | 1 c/u |

Se parten en dos grupos que no cuestan lo mismo:

- **Bootstrap de datos** (`navbar.tsx`, `aulas/page.tsx`, `teacher/page.tsx`): un `fetch` en
  un efecto que guarda la respuesta en estado. Es el patrón que la regla marca por defecto y
  el que menos vale la pena reescribir: la salida real es mover la carga al servidor, que es
  un cambio de arquitectura, no un lint fix.
- **Sincronización de estado derivado** (`teacher-subject-wizard.tsx`, `explanation-modal.tsx`):
  estado que se recalcula a partir de props o de otro estado. Estos **sí** conviene cerrarlos:
  son los que producen renders de más y estados imposibles, y el arreglo es derivar en vez de
  sincronizar. `quiz-overlay.tsx` es de este grupo y ya tiene un `eslint-disable` de
  `exhaustive-deps` puesto a mano, señal de que el efecto viene siendo incómodo hace rato.

### 4c. El resto — ruido, salvo dos

- **`no-unused-vars` (14)**: `app/(app)/teacher/page.tsx` (5) y `components/weak-points-section.tsx`
  (4) concentran la mayoría. Cero riesgo, borrado mecánico. Ya venía como warning en el
  preset, así que no bloqueaba nada.
- **`prefer-const` (2)**: `teoricoCollected` y `practicoCollected` en
  `app/api/generate-quiz/route.ts:712-713`. `eslint --fix` los cierra solos. Quedaron para no
  mezclar un cambio de código con el commit que instala la herramienta.
- **`no-assign-module-variable` (2)**: `const module = await import('word-extractor')` en
  `app/api/teacher/programs/extract/route.ts:238` y `.../guide/route.ts:165`. No reasigna
  nada — declara una variable llamada igual que el `module` de CommonJS, que el bundler puede
  terminar sombreando. Se arregla renombrando la variable. **Nota aparte: las dos rutas tienen
  el mismo helper de extracción duplicado**; el lint lo hizo visible de casualidad.
- **`no-img-element` (1)**: el avatar de Google en `components/navbar.tsx:283`. **No aplica**:
  `next.config.mjs` tiene `images.unoptimized: true`, así que `next/image` no optimizaría nada
  y sólo agregaría peso. Se deja como está, por la misma razón que el punto 5 de `npm audit`.
- **`react-hooks/purity` (1)**: `Math.random()` dentro de un `useMemo` en
  `components/ui/sidebar.tsx:611`, para el ancho del skeleton. Es código **vendorizado** de
  shadcn/ui, que CLAUDE.md dice componer y no reescribir. Arreglarlo se perdería en el
  próximo `npx shadcn add`. La regla queda en `warn` sólo para `components/ui/**`, con eso
  escrito en la config.

### Orden sugerido para cerrarlo

Por relación costo/beneficio, no por cantidad:

1. **`prefer-const` + `no-unused-vars` (16)** — un `eslint --fix` y un borrado. Baja el ruido
   del reporte un 17% en una sentada, que es lo que hace que el resto se vuelva legible.
2. **`no-assign-module-variable` (2)** — renombrar dos variables, y de paso decidir qué hacer
   con el helper de extracción duplicado.
3. **`no-explicit-any` en `lib/db.ts` (2)** — es el tipo del driver, no una fila; se cierra
   solo importando el tipo de `@neondatabase/serverless`.
4. **`set-state-in-effect`, grupo "estado derivado"** (~8 de los 22) — los que dan bugs de
   verdad.
5. **`no-explicit-any` sobre filas de Neon (~48)** — archivo por archivo, empezando por
   `generate-quiz` que tiene 18. Mismo método que la sección 3a: una interfaz por query, con
   un comentario que apunte al `.sql` del DDL.
6. **`set-state-in-effect`, grupo "bootstrap"** (~14) — último, porque el arreglo real es
   mover la carga al servidor y eso no es un lint fix.

Recién con (1)–(5) hechos tiene sentido subir las reglas a `error` y meter `npm run lint` en CI.

---

## Riesgos latentes

Cosas que hoy no molestan y que van a morder si cambia una condición. No son tareas: son
avisos para el momento en que alguien toque justo eso.

### Corepack y el pin de `packageManager`

`package.json` declara `"packageManager": "npm@10.9.8"`, que es el npm que trae Node 22 —
la versión que fija CI ([ci.yml](../.github/workflows/ci.yml#L21)). El entorno de
desarrollo actual corre **Node 24 / npm 11**.

Hoy no pasa nada: Corepack está instalado (0.34.6) pero **no está interceptando `npm`**;
el binario que se ejecuta es el que viene con Node, así que el campo es metadata inerte y
sirve nada más para declarar que el gestor es npm y no pnpm.

Se enciende en dos escenarios:

1. **Alguien corre `corepack enable`.** Ahí Corepack empieza a hacer valer el pin, y la
   diferencia entre el npm declarado (10.9.8) y el local (11.x) pasa de ser cosmética a
   ser un error duro en cada comando.
2. **CI se actualiza dentro de Node 22.** El workflow fija `node-version: '22'`, no una
   versión exacta, así que cuando salga un Node 22 con otro npm, el número pineado deja de
   describir lo que CI realmente usa — que era justamente para lo que se puso.

Si alguna vez molesta, la salida es fijar la versión exacta de Node en el workflow y que
el pin de npm la siga. Se dejó como está a propósito: el valor del campo hoy es declarar
**qué gestor** se usa, no clavar una versión.

### `images.unoptimized: true` y `sharp`

Ver el punto 5 de `npm audit`. Está comentado en `next.config.mjs`.

### `feedback_reports` y el refresco de staging

La migración 019 agrega [`feedback_reports`](../scripts/019-feedback-reports.sql), que guarda
**texto libre escrito por personas reales**. No tiene columna de email, pero es dato personal
de hecho: un alumno que reporta un problema escribe lo que se le ocurre, incluido su nombre
o el de su docente.

[`scripts/anonymize-staging.ts`](../scripts/anonymize-staging.ts) ya borra las dos tablas
equivalentes (`verification_tokens` y `teacher_program_uploads`) y **todavía no borra esta**.
Hoy no molesta porque la tabla no existe en ninguna base; muerde el día que alguien clone
producción a staging después de correr la 019.

El arreglo es una línea (`DELETE FROM feedback_reports`) junto a las otras dos. Quedó sin
hacer a propósito: tocar el script de anonimización es tocar el procedimiento de refresco de
branch, y eso no entraba en el alcance del commit que agregó el botón.

---

## Prioridades abiertas

### Arreglar antes de invitar usuarios

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

### Próximo sprint

4. **Borrar o corregir las interfaces `Db*` sin uso de `lib/db.ts`** (ver 3a). No rompen
   nada, pero son tipos equivocados esperando que alguien los adopte de buena fe.
5. **Primeros dos pasos del orden sugerido de ESLint** (ver 4): `eslint --fix` para
   `prefer-const` y el borrado de los 14 `no-unused-vars`. 16 de los 93 warnings, sin
   riesgo, y es lo que vuelve legible al reporte.

### Vivir con esto

5. **`postcss`** — sólo build, y todo el CSS es propio. Se arregla solo con el bump de `next`.
6. **`sharp`** — camino de código muerto por `images.unoptimized: true`.
7. **`vite`** — devDependency, nunca se despliega.
