import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function run() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('DATABASE_URL no encontrada en .env.local')
    process.exit(1)
  }

  const sql = neon(dbUrl)

  console.log('Ejecutando migración 014 (nivel/grado en materias docentes) en la base de datos Neon...')

  await sql`
    ALTER TABLE teacher_programs
      ADD COLUMN IF NOT EXISTS nivel TEXT
        CHECK (nivel IN ('Primario', 'Secundario', 'Superior')),
      ADD COLUMN IF NOT EXISTS grado TEXT,
      ADD COLUMN IF NOT EXISTS jurisdiccion TEXT,
      ADD COLUMN IF NOT EXISTS created_from TEXT NOT NULL DEFAULT 'upload'
        CHECK (created_from IN ('upload', 'curriculum', 'manual'));
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_teacher_programs_user_nivel_grado
      ON teacher_programs(user_id, nivel, grado);
  `

  console.log('✅ ¡Migración 014 ejecutada con éxito en PostgreSQL / Neon!')
  console.log('   Siguiente paso opcional: npx tsx scripts/backfill-program-nivel-grado.ts')
}

run().catch((err) => {
  console.error('❌ Error en la migración:', err)
  process.exit(1)
})
