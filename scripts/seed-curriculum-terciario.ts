/**
 * scripts/seed-curriculum-terciario.ts
 *
 * Seeder: Currícula Oficial de Salta — Nivel SUPERIOR / TERCIARIO (Esqueleto)
 * Materias: Programas del Nivel Superior (Ej. Profesorado, Ingenierías)
 *
 * Usage:  npx tsx scripts/seed-curriculum-terciario.ts
 */

import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

interface CurriculumEntry {
  jurisdiccion?: string
  nivel: 'Primario' | 'Secundario' | 'Superior'
  materia: string
  grado: string
  eje: string
  temas: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA — Nivel SUPERIOR / TERCIARIO (Esqueleto de demostración)
// ─────────────────────────────────────────────────────────────────────────────

const DATA: CurriculumEntry[] = [
  {
    nivel: 'Superior',
    materia: 'Álgebra Lineal',
    grado: '1er Año',
    eje: 'Espacios Vectoriales',
    temas: [
      'Espacios vectoriales y subespacios. Definición y propiedades fundamentales.',
      'Combinación lineal, conjunto generador y dependencia lineal.',
      'Base y dimensión de un espacio vectorial. Coordenadas e isomorfismos.',
      'Espacios con producto interno: ortogonalidad y proceso de Gram-Schmidt.'
    ]
  },
  {
    nivel: 'Superior',
    materia: 'Álgebra Lineal',
    grado: '1er Año',
    eje: 'Transformaciones Lineales',
    temas: [
      'Definición de transformación lineal, núcleo (kernel) e imagen.',
      'Teorema de la dimensión para transformaciones lineales.',
      'Representación matricial de una transformación lineal y cambio de base.',
      'Valores propios (eigenvalores), vectores propios (eigenvectores) y diagonalización.'
    ]
  },
  {
    nivel: 'Superior',
    materia: 'Cálculo Avanzado',
    grado: '2do Año',
    eje: 'Integrales Múltiples',
    temas: [
      'Integrales dobles y triples sobre regiones generales.',
      'Cambio de variables en integrales múltiples: coordenadas polares, cilíndricas y esféricas.',
      'Aplicaciones de integrales múltiples: cálculo de áreas, volúmenes, masa y centros de gravedad.',
      'Integrales de línea e integrales de superficie. Teoremas de Green, Stokes y de la divergencia.'
    ]
  }
]

// ─────────────────────────────────────────────────────────────────────────────
// Seeder logic
// ─────────────────────────────────────────────────────────────────────────────

async function seed() {
  console.log(`Seeding ${DATA.length} curriculum rows (Nivel Superior)...`)
  let inserted = 0
  let skipped = 0
  let errors = 0

  for (const entry of DATA) {
    try {
      await sql`
        INSERT INTO curriculum (jurisdiccion, nivel, materia, grado, eje, temas)
        VALUES (
          ${entry.jurisdiccion ?? 'Salta'},
          ${entry.nivel},
          ${entry.materia},
          ${entry.grado},
          ${entry.eje},
          ${JSON.stringify(entry.temas)}::jsonb
        )
      `
      inserted++
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('duplicate') || msg.includes('unique')) {
        skipped++
      } else {
        errors++
        console.error(`  ✗ [${entry.materia} / ${entry.grado} / ${entry.eje.slice(0, 40)}]: ${msg}`)
      }
    }
  }

  console.log(`\n✅ Done.`)
  console.log(`   Inserted : ${inserted}`)
  console.log(`   Skipped  : ${skipped}  (duplicate rows)`)
  console.log(`   Errors   : ${errors}`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seeder failed:', err)
  process.exit(1)
})
