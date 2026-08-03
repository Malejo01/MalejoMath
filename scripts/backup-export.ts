/**
 * Logical backup: pg_dump → gpg (AES256) → Vercel Blob privado.
 *
 * ─── Por qué existe, si Neon ya tiene PITR ──────────────────────────────────
 * El PITR de Neon cubre "volver la base a como estaba hace N horas/días" y lo
 * hace muy bien. No cubre tres cosas, y son justo las que duelen:
 *
 *   1. Corrupción lógica descubierta tarde. Una migración que mangle
 *      answer_payload en silencio y se note tres semanas después ya quedó
 *      fuera de la ventana de retención. Un dump semanal, no.
 *   2. Fallo a nivel cuenta. El PITR vive DENTRO de Neon: baja por impago,
 *      borrado del proyecto o cuenta comprometida se lo lleva puesto. Una copia
 *      afuera no comparte ese dominio de falla.
 *   3. Portabilidad. Un .sql plano entra en cualquier Postgres. Es la salida
 *      del lock-in y, de paso, el entorno de debug local.
 *
 * ─── Dos capas de acceso, a propósito ───────────────────────────────────────
 * El blob se sube con access:'private' (requiere token) Y cifrado con gpg
 * simétrico. La redundancia es deliberada: el token de Blob vive en el mismo
 * GitHub que dispara el workflow, así que quien comprometa el repo tiene el
 * token. La passphrase gpg es lo que hace que eso no alcance — por eso el
 * runbook insiste en que exista fuera de GitHub.
 */
import { spawn } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { mkdtemp, rm, stat, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { put, list, del } from '@vercel/blob'
import { resolveDbTarget } from './lib/db-target'

/**
 * Tables whose SCHEMA is dumped but whose ROWS are not.
 *
 * teacher_program_uploads holds the raw bytes of every PDF/Word a teacher
 * uploaded, and the app already treats them as disposable (they carry an
 * expires_at). Dumping them would make every backup weigh megabytes of files
 * that delete themselves anyway.
 *
 * ai_usage_log is a rate-limit ledger: one row per Gemini call, useful live,
 * meaningless once restored. Both names are listed because migration 016
 * renames ai_generation_log → ai_usage_log; pg_dump ignores a pattern that
 * matches nothing, so keeping both makes the script work either side of it.
 */
const EXCLUDE_TABLE_DATA = ['public.teacher_program_uploads', 'public.ai_usage_log', 'public.ai_generation_log']

const BLOB_PREFIX = 'db-backups/'

/** How many backups to keep. Older ones are deleted after a successful upload. */
const KEEP_BACKUPS = Number.parseInt(process.env.BACKUP_KEEP ?? '30', 10)

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    console.error(`❌ Falta la variable de entorno ${name} (no se proveyó en process.env).`)
    process.exit(1)
  }
  return value
}

/**
 * pg_dump cannot go through PgBouncer: the pooled endpoint does not support
 * the session-level state a dump needs, so it either fails or returns something
 * subtly incomplete. Neon exposes the direct endpoint as the same host without
 * the `-pooler` suffix.
 */
function resolveDirectUrl(): string {
  const explicit = process.env.DATABASE_URL_UNPOOLED ?? process.env.POSTGRES_URL_NON_POOLING
  if (explicit) return explicit

  const pooled = requireEnv('DATABASE_URL')
  const url = new URL(pooled)
  if (!url.hostname.includes('-pooler')) return pooled

  url.hostname = url.hostname.replace('-pooler', '')
  console.warn(`⚠  Sin DATABASE_URL_UNPOOLED; derivando el endpoint directo → ${url.hostname}`)
  return url.toString()
}

function run(command: string, args: string[]): Promise<{ code: number; stderr: string; stdout: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args)
    let stderr = ''
    let stdout = ''
    child.stderr.on('data', (chunk) => (stderr += chunk))
    child.stdout.on('data', (chunk) => (stdout += chunk))
    child.on('error', reject)
    child.on('close', (code) => resolve({ code: code ?? 1, stderr, stdout }))
  })
}

async function assertToolchain(serverMajor: number): Promise<void> {
  const dump = await run('pg_dump', ['--version']).catch(() => null)
  if (!dump || dump.code !== 0) {
    console.error('❌ pg_dump no está instalado o no está en el PATH.')
    console.error('   Este script está pensado para correr en GitHub Actions (ver .github/workflows/backup.yml),')
    console.error('   donde el workflow instala postgresql-client-17 desde el repo PGDG.')
    process.exit(1)
  }

  // A dump taken by an older pg_dump against a newer server is not merely
  // risky, pg_dump refuses outright — better to say why here than to surface
  // its error from inside a CI log.
  const clientMajor = Number.parseInt(/(\d+)/.exec(dump.stdout)?.[1] ?? '0', 10)
  if (clientMajor < serverMajor) {
    console.error(`❌ pg_dump ${clientMajor} es más viejo que el servidor (PostgreSQL ${serverMajor}).`)
    console.error(`   Instalá postgresql-client-${serverMajor} o superior.`)
    process.exit(1)
  }
  console.log(`  · pg_dump ${clientMajor} vs servidor ${serverMajor} ✔`)

  const gpg = await run('gpg', ['--version']).catch(() => null)
  if (!gpg || gpg.code !== 0) {
    console.error('❌ gpg no está instalado o no está en el PATH.')
    process.exit(1)
  }
}

/**
 * Streams pg_dump straight into gpg, so the UNENCRYPTED dump never touches
 * disk. It contains every student name and email in the platform; writing it to
 * a temp file first would leave that lying in the runner's filesystem (and in
 * any crash artifact) for the seconds between dump and encrypt.
 */
function dumpAndEncrypt(connectionString: string, passphrase: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const pgDump = spawn('pg_dump', [
      connectionString,
      '--format=plain',
      '--schema=public',
      // Neon branches and a restored project have different role names, so
      // keeping owners/grants in the dump makes it fail on the way back in.
      '--no-owner',
      '--no-privileges',
      ...EXCLUDE_TABLE_DATA.map((table) => `--exclude-table-data=${table}`),
    ])

    const gpg = spawn(
      'gpg',
      [
        '--batch',
        '--yes',
        '--symmetric',
        '--cipher-algo',
        'AES256',
        // fd 3, because fd 0 is already carrying the dump. Passing the
        // passphrase as an argv item would expose it in the process list.
        '--passphrase-fd',
        '3',
        '--output',
        outputPath,
      ],
      { stdio: ['pipe', 'pipe', 'pipe', 'pipe'] },
    )

    const passphraseFd = gpg.stdio[3] as NodeJS.WritableStream
    passphraseFd.write(`${passphrase}\n`)
    passphraseFd.end()

    let pgDumpErr = ''
    let gpgErr = ''
    pgDump.stderr.on('data', (chunk) => (pgDumpErr += chunk))
    gpg.stderr.on('data', (chunk) => (gpgErr += chunk))

    pgDump.stdout.pipe(gpg.stdin)

    pgDump.on('error', reject)
    gpg.on('error', reject)

    let pgDumpCode: number | null = null
    let gpgCode: number | null = null

    const settle = () => {
      if (pgDumpCode === null || gpgCode === null) return
      // pg_dump is checked first: when it fails, gpg happily encrypts the
      // partial output and exits 0, which would otherwise look like success.
      if (pgDumpCode !== 0) return reject(new Error(`pg_dump falló (${pgDumpCode}):\n${pgDumpErr}`))
      if (gpgCode !== 0) return reject(new Error(`gpg falló (${gpgCode}):\n${gpgErr}`))
      resolve()
    }

    pgDump.on('close', (code) => {
      pgDumpCode = code
      settle()
    })
    gpg.on('close', (code) => {
      gpgCode = code
      settle()
    })
  })
}

/**
 * Decrypts what was just written and checks it looks like a real dump.
 *
 * This is the step that catches the classic failure: months of backups that
 * upload cleanly, and turn out to be empty, truncated or undecryptable on the
 * one day they matter. A backup nobody has restored is a hypothesis.
 */
async function verify(outputPath: string, passphrase: string): Promise<void> {
  const gpg = spawn('gpg', ['--batch', '--yes', '--decrypt', '--passphrase-fd', '3', outputPath], {
    stdio: ['ignore', 'pipe', 'pipe', 'pipe'],
  })

  const passphraseFd = gpg.stdio[3] as NodeJS.WritableStream
  passphraseFd.write(`${passphrase}\n`)
  passphraseFd.end()

  let plaintext = ''
  // Non-null: the stdio array above declares fd 1 as 'pipe'; TypeScript widens
  // every slot to nullable when stdio is given explicitly.
  const stdout = gpg.stdout as NodeJS.ReadableStream
  stdout.on('data', (chunk) => (plaintext += chunk))

  const code = await new Promise<number>((resolve, reject) => {
    gpg.on('error', reject)
    gpg.on('close', (value) => resolve(value ?? 1))
  })

  if (code !== 0) throw new Error('El archivo cifrado no se pudo descifrar con la passphrase usada.')
  if (!plaintext.includes('PostgreSQL database dump')) {
    throw new Error('El contenido descifrado no parece un dump de PostgreSQL.')
  }

  // The tables that must carry data. If a future refactor accidentally adds one
  // of these to EXCLUDE_TABLE_DATA, the backup would still "work" while
  // silently dropping the thing it exists to protect.
  for (const table of ['users', 'quiz_attempts', 'teacher_programs', 'classrooms']) {
    if (!plaintext.includes(`CREATE TABLE public.${table}`)) {
      throw new Error(`El dump no contiene la tabla ${table}.`)
    }
  }

  const copyBlocks = (plaintext.match(/^COPY public\./gm) ?? []).length
  console.log(`  · Verificado: descifra OK, ${copyBlocks} bloque(s) COPY, ${plaintext.length.toLocaleString()} bytes`)
}

async function prune(token: string): Promise<void> {
  const { blobs } = await list({ prefix: BLOB_PREFIX, token })
  if (blobs.length <= KEEP_BACKUPS) {
    console.log(`  · Retención: ${blobs.length}/${KEEP_BACKUPS} backups, no hay nada que borrar`)
    return
  }

  const stale = blobs
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .slice(KEEP_BACKUPS)

  await del(
    stale.map((blob) => blob.url),
    { token },
  )
  console.log(`  · Retención: borrados ${stale.length} backup(s) viejos, quedan ${KEEP_BACKUPS}`)
}

async function main() {
  const passphrase = requireEnv('BACKUP_GPG_PASSPHRASE')
  const blobToken = requireEnv('BLOB_READ_WRITE_TOKEN')

  // destructive:false — a backup only reads, so it must never sit waiting on
  // the production confirmation prompt inside a scheduled workflow.
  const target = await resolveDbTarget({ action: 'backup', destructive: false })

  const versionRows = (await target.sql`SELECT current_setting('server_version_num')::int AS num`) as {
    num: number
  }[]
  const serverMajor = Math.floor(versionRows[0].num / 10000)

  await assertToolchain(serverMajor)

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16)
  const name = `maestria-${target.environment}-${stamp}.sql.gpg`
  const workDir = await mkdtemp(join(tmpdir(), 'maestria-backup-'))
  const outputPath = join(workDir, name)

  try {
    console.log(`\nGenerando backup de ${target.environment}...`)
    await dumpAndEncrypt(resolveDirectUrl(), passphrase, outputPath)

    const { size } = await stat(outputPath)
    console.log(`  · Cifrado: ${(size / 1024).toFixed(1)} KiB`)
    if (size < 512) throw new Error(`El backup pesa ${size} bytes — es demasiado chico para ser real.`)

    await verify(outputPath, passphrase)

    const blob = await put(`${BLOB_PREFIX}${name}`, await readFile(outputPath), {
      access: 'private',
      token: blobToken,
      contentType: 'application/pgp-encrypted',
      addRandomSuffix: false,
      allowOverwrite: true,
    })
    console.log(`  · Subido: ${blob.pathname}`)

    await prune(blobToken)
    console.log(`\n✅ Backup completo: ${name}`)
  } finally {
    // The encrypted file is safe at rest, but the runner is shared and there is
    // no reason to leave it behind.
    await rm(workDir, { recursive: true, force: true })
  }
}

main().catch((err) => {
  console.error('\n❌ Backup fallido:', err.message ?? err)
  process.exit(1)
})
