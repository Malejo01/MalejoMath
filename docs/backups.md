# Runbook — Backups y recuperación

Proyecto Neon: **`noisy-smoke-23995229`** · PostgreSQL 17 · región `us-east-1` (AWS).

---

## 1. Qué protege cada capa

| | **PITR de Neon** | **Dump cifrado en Vercel Blob** |
|---|---|---|
| Qué es | Ventana de historial de la branch | `pg_dump` plano, AES256, diario |
| RPO (cuánto podés perder) | Segundos | Hasta 24 h |
| RTO (cuánto tarda volver) | Segundos — es una branch nueva | 10–30 min |
| Alcance temporal | Sólo dentro de la ventana de retención | Ilimitado (últimos 30 archivos) |
| Sobrevive a… | Un `DELETE` sin `WHERE`, una migración mala | Lo anterior **+** perder la cuenta de Neon |
| Dónde vive | Dentro de Neon | Fuera de Neon |

Las dos capas existen porque cubren fallas distintas. El PITR es rapidísimo pero comparte destino con la cuenta de Neon y sólo alcanza hasta donde llega su ventana. El dump es más lento y más viejo, pero es la única copia que sigue existiendo si el proyecto de Neon desaparece.

### Ventana de retención del PITR — verificála

En Neon el PITR **no es un interruptor**: toda branch tiene una ventana de historial y podés crear una branch desde cualquier instante dentro de ella. Lo único que hay que saber es cuánto mide.

- Consola: *Project* → *Settings* → *Storage* → history retention.
- API: `GET /api/v2/projects/noisy-smoke-23995229` → campo `history_retention_seconds`.

> **Anotá acá el valor real cuando lo verifiques:** History window: 6h (Free Plan, máximo disponible). PITR solo cubre el mismo día — todo lo anterior depende exclusivamente del dump diario a Vercel Blob.

---

## 2. Puesta en marcha (una sola vez)

### 2.1 Crear el Blob store

En Vercel: *Storage* → *Create* → *Blob*. Copiá el `BLOB_READ_WRITE_TOKEN`.

### 2.2 Generar la passphrase

```bash
openssl rand -base64 48
```

### 2.3 Dónde guardar la passphrase — leé esto antes de seguir

El backup está cifrado con esa passphrase. **Si la perdés, los backups son bytes inservibles**: no hay recuperación, no hay soporte que la resetee, no existe una copia en Vercel ni en ningún lado.

Va en GitHub Secrets porque el workflow la necesita. Pero **no puede vivir sólo ahí**, y el motivo es el punto entero de tener una copia fuera de Neon: si perdés el acceso a GitHub — cuenta comprometida, organización dada de baja, repo borrado — te quedás sin la passphrase **y** sin el workflow, con los backups intactos y para siempre ilegibles.

Guardala en **al menos dos** de estos, y que uno no sea GitHub:

1. **Gestor de contraseñas** (Bitwarden, 1Password, iCloud Keychain) — primaria. Entrada aparte, con nota "passphrase de backups MaestrIA — sin esto los backups no se pueden leer".
2. **En papel**, en un lugar físico seguro. Suena arcaico y es el único medio que no comparte modo de falla con ninguna cuenta online.
3. **Otro dispositivo tuyo**, offline, cifrado.

Dónde **no** ponerla: en `.env.local` (se va con la laptop), en el repo (aunque sea privado), en un chat o mail, en Vercel (mezcla el destino del backup con la llave que lo abre).

### 2.4 Cargar los GitHub Secrets

En *Settings* → *Secrets and variables* → *Actions*:

| Secret | De dónde sale |
|---|---|
| `DATABASE_URL` | `.env.local` de producción |
| `DATABASE_URL_UNPOOLED` | Ídem — **el endpoint directo, sin `-pooler`** |
| `NEON_PROJECT_ID` | `noisy-smoke-23995229` |
| `BACKUP_GPG_PASSPHRASE` | La del paso 2.2 |
| `BLOB_READ_WRITE_TOKEN` | Del paso 2.1 |

`DATABASE_URL_UNPOOLED` no es un detalle: `pg_dump` no puede pasar por PgBouncer. Si falta, el script lo deriva sacando `-pooler` del hostname y avisa, pero es mejor que esté explícito.

### 2.5 Probar

*Actions* → *Backup de base de datos* → *Run workflow*. Debería terminar en verde y dejar un archivo en `db-backups/`.

---

## 3. Qué corre, y cuándo

[`.github/workflows/backup.yml`](../.github/workflows/backup.yml) — todos los días a las **03:15 UTC** (00:15 en Argentina), y a demanda.

Corre en GitHub Actions y no en una laptop por dos razones: `pg_dump` tiene que ser ≥ 17 para dumpear un servidor 17 y ninguna máquina del equipo tiene cliente Postgres; y un backup que depende de que alguien se acuerde no es un backup.

El script ([`scripts/backup-export.ts`](../scripts/backup-export.ts)):

1. `pg_dump` por el endpoint directo, **entubado a `gpg`** — el dump sin cifrar nunca toca el disco.
2. **Verifica el resultado**: lo descifra, confirma que es un dump de PostgreSQL y que contiene `users`, `quiz_attempts`, `teacher_programs` y `classrooms`. Esto es lo que evita el clásico "seis meses de backups que resultan estar vacíos".
3. Sube a Vercel Blob con `access: 'private'` (requiere token) — cifrado **y** privado.
4. Borra los que pasen de 30.

Si la corrida programada falla, abre un issue con la etiqueta `backup-failure`. Un backup que falla en silencio es peor que no tenerlo, porque genera confianza.

### Qué se dumpea

Todo el schema `public`, salvo los **datos** de dos tablas (el schema sí va):

- `teacher_program_uploads` — bytes crudos de los PDF/Word que suben los docentes. La app ya los trata como descartables (tienen `expires_at`), así que dumpearlos engordaría cada backup con archivos que se borran solos.
- `ai_usage_log` — el ledger del rate limit: una fila por llamada a Gemini. Útil en vivo, sin sentido restaurado.

---

## 4. Restaurar

### 4.1 Desde el PITR (primera opción, casi siempre)

Sirve si el desastre entra en la ventana de retención. **No sobrescribas la branch viva.**

1. Neon → *Branches* → *Create branch*.
2. Origen: `production`. En *Include data up to*, elegí el instante **anterior** al desastre.
3. Nombrala `recovery-YYYY-MM-DD`.
4. Conectate a esa branch y verificá que los datos estén bien **antes** de tocar nada más.
5. Cuando confirmaste: o repuntás `DATABASE_URL` en Vercel a la branch de recuperación, o copiás las filas que faltan a producción con SQL.

La opción de repuntar es más rápida y menos riesgosa que copiar a mano — restaurar es también el peor momento para escribir un `INSERT ... SELECT` complicado.

### 4.2 Desde el dump cifrado

Cuando el desastre quedó fuera de la ventana, o Neon no está disponible.

**Bajar el archivo.** Los blobs son privados, así que no alcanza con pegar la URL en el navegador:

```bash
npx tsx -e "import {list} from '@vercel/blob'; const t=process.env.BLOB_READ_WRITE_TOKEN; const {blobs}=await list({prefix:'db-backups/',token:t}); blobs.sort((a,b)=>new Date(b.uploadedAt)-new Date(a.uploadedAt)).slice(0,10).forEach(b=>console.log(b.uploadedAt, b.pathname, b.downloadUrl))"
```

**Descifrar** (pide la passphrase):

```bash
gpg --decrypt maestria-production-2026-08-03T03-15.sql.gpg > restore.sql
```

**Restaurar en una branch nueva** — nunca directo sobre producción:

```bash
psql "postgres://...branch-de-restore.../neondb?sslmode=require" -f restore.sql
```

El dump se toma con `--no-owner --no-privileges`, así que entra en cualquier proyecto o branch sin pelear con nombres de roles.

**Revisar antes de repuntar nada:**

```sql
SELECT count(*) FROM users;
SELECT count(*) FROM quiz_attempts;
SELECT max(completed_at) FROM quiz_attempts;   -- ¿hasta cuándo llega?
```

### 4.3 Restaurar en local, para debuggear

```bash
docker run --name maestria-restore -e POSTGRES_PASSWORD=local -p 5433:5432 -d postgres:17
gpg --decrypt backup.sql.gpg | psql postgres://postgres:local@localhost:5433/postgres
```

---

## 5. Qué **NO** está cubierto

Esto es lo que nadie recuerda hasta el día malo.

**Ninguna de las dos capas guarda:**

- **La configuración del OAuth de Google.** Client ID, secret y redirect URIs viven en Google Cloud Console. Si se pierde ese proyecto, nadie puede loguearse aunque la base esté perfecta.
- **`AUTH_SECRET`.** No está en la base. Y ojo con el efecto secundario en día de restore: **rotarlo desloguea a todos** los usuarios con sesión activa.
- **La API key de Gemini.**
- **La configuración del proyecto Vercel**: variables de entorno, dominios, settings de build.
- **El código.** Eso es git — pero si el repo se pierde, se pierden también los workflows y las migraciones que hacen falta para reconstruir el schema.

**El dump específicamente no guarda:**

- Todo lo ocurrido **desde la última corrida** (hasta 24 h).
- Los **archivos subidos por docentes** (`teacher_program_uploads`) — excluidos a propósito, ver §3.
- El historial de uso de IA (`ai_usage_log`).

**El PITR específicamente no guarda:**

- Nada anterior a la ventana de retención.
- Nada, si se pierde el acceso a la cuenta de Neon.

### Lo que falta para cerrar el círculo

Anotá en algún lado — fuera de este repo — cómo recrear el OAuth client de Google y dónde están las API keys. La base restaurada sin eso es una app a la que nadie puede entrar.

---

## 6. Mantenimiento

- **Cada trimestre: restaurá un backup de verdad** (§4.3, tarda 10 minutos). Un backup que nunca se restauró es una hipótesis, no un respaldo. La verificación automática del §3 chequea que el archivo sea legible y esté completo, pero no que vos sepas usarlo bajo presión.
- **Si cambiás la passphrase**, los backups viejos siguen atados a la anterior. Guardá las dos hasta que roten los 30 archivos.
- **Cuando entren usuarios reales**, revisá si 24 h de RPO sigue siendo aceptable. Pasar a dos corridas diarias es cambiar una línea de cron.
