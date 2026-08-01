import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

dotenv.config({ path: '.env.local' })

/**
 * Migration 015 is long enough that keeping the SQL in one place beats
 * duplicating it here. Statements are split on ";\n" boundaries because the
 * neon serverless driver runs one statement per call.
 */
async function run() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('DATABASE_URL no encontrada en .env.local')
    process.exit(1)
  }

  const sql = neon(dbUrl)
  const file = readFileSync(join(process.cwd(), 'scripts', '015-classrooms.sql'), 'utf8')

  const statements = file
    .split(/;\s*\n/)
    // Drop comment-only chunks so we don't send empty statements.
    .map((chunk) => chunk.split('\n').filter((line) => !line.trim().startsWith('--')).join('\n').trim())
    .filter((chunk) => chunk.length > 0)

  console.log(`Ejecutando migración 015 (aulas) — ${statements.length} sentencias...`)

  for (const [index, statement] of statements.entries()) {
    const label = statement.replace(/\s+/g, ' ').slice(0, 70)
    try {
      // The neon driver only accepts a tagged template for `sql`; raw DDL goes
      // through sql.query, which takes a plain string.
      await sql.query(statement)
      console.log(`  ✔ ${index + 1}/${statements.length} ${label}...`)
    } catch (error) {
      console.error(`  ✖ ${index + 1}/${statements.length} ${label}...`)
      throw error
    }
  }

  console.log('✅ ¡Migración 015 ejecutada con éxito en PostgreSQL / Neon!')
}

run().catch((err) => {
  console.error('❌ Error en la migración:', err)
  process.exit(1)
})
