import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import { DEFAULT_JURISDICTION } from '../lib/curriculum-config'

dotenv.config({ path: '.env.local' })

async function run() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('DATABASE_URL no encontrada en .env.local')
    process.exit(1)
  }

  const sql = neon(dbUrl)

  console.log('Actualizando la materia "Espacio Institucional de Tutoría y Espacio de Apoyo" para que exista en 1er, 2do, 3er, 4to y 5to Año...')

  // 1. Eliminar filas antiguas con grado '1er a 5to Año'
  await sql`
    DELETE FROM curriculum 
    WHERE nivel = 'Secundario' 
      AND (grado = '1er a 5to Año' OR grado LIKE '%1er a 5to%');
  `

  const tutoriaTemasEje1 = [
    'Acompañamiento y orientación de los alumnos durante el ingreso, permanencia y egreso del Nivel Secundario.',
    'Reconocimiento de habilidades y limitaciones de los estudiantes para favorecer el aprendizaje autónomo.',
    'Valoración del trabajo en equipo, colectivo, a través del intercambio de ideas y experiencias en el marco de la cultura juvenil.',
    'Construcción del proyecto de vida personal y colectivo: orientación vocacional y ocupacional.',
    'Desarrollo de competencias para el manejo crítico de las TIC y prevención de riesgos en redes sociales, chat y páginas personales.'
  ]

  const tutoriaTemasEje2 = [
    'Actualización y profundización de contenidos disciplinares en función de las necesidades detectadas en el diagnóstico.',
    'Innovación en las metodologías de enseñanza y diseño de propuestas de aprendizaje cooperativo.',
    'Elaboración de propuestas de transversalización de contenidos (Educación Ambiental, Vial, Sexual Integral).',
    'Propuestas de investigación escolar utilizando el método científico y herramientas informáticas.',
    'Acompañamiento a las trayectorias escolares discontinuas y apoyo escolar para evitar el bajo rendimiento y la deserción.'
  ]

  const anos = ['1er Año', '2do Año', '3er Año', '4to Año', '5to Año']

  for (const anio of anos) {
    await sql`
      INSERT INTO curriculum (jurisdiccion, nivel, materia, grado, eje, temas)
      VALUES (
        ${DEFAULT_JURISDICTION},
        'Secundario',
        'Espacio Institucional de Tutoría y Espacio de Apoyo',
        ${anio},
        'Espacio Institucional de Tutoría',
        ${JSON.stringify(tutoriaTemasEje1)}::jsonb
      );
    `
    await sql`
      INSERT INTO curriculum (jurisdiccion, nivel, materia, grado, eje, temas)
      VALUES (
        ${DEFAULT_JURISDICTION},
        'Secundario',
        'Espacio Institucional de Tutoría y Espacio de Apoyo',
        ${anio},
        'Espacio de Apoyo',
        ${JSON.stringify(tutoriaTemasEje2)}::jsonb
      );
    `
  }

  console.log('✅ ¡Base de datos actualizada! Ahora la materia "Espacio Institucional de Tutoría y Espacio de Apoyo" pertenece a cada uno de los 5 años y desapareció "1er a 5to Año".')
}

run().catch((err) => {
  console.error('Error al actualizar la base de datos:', err)
  process.exit(1)
})
