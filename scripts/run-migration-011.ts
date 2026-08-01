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

  console.log('Ejecutando migración 011 (nivel/grado de usuario) en la base de datos Neon...')

  await sql`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS nivel TEXT CHECK (nivel IN ('Primario', 'Secundario', 'Superior')),
      ADD COLUMN IF NOT EXISTS grado TEXT;
  `

  console.log('✅ ¡Migración 011 ejecutada con éxito en PostgreSQL / Neon!')
}

run().catch((err) => {
  console.error('❌ Error en la migración:', err)
  process.exit(1)
})
