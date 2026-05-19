import type {
  PedagogyProfile,
  Subject,
  TeacherProgram,
  ProgramUnit,
  ProgramTopic,
  SubjectColorName,
  SubjectIconName,
} from '@/lib/types'

type LegacySubtopic = { id?: string; name?: string }
type LegacyProgramTopic = ProgramTopic & { subtopics?: LegacySubtopic[] }

function normalizeUnits(units: ProgramUnit[] | unknown): ProgramUnit[] {
  if (!Array.isArray(units)) {
    return []
  }

  return units.map((unit, unitIndex) => {
    const safeTopics = Array.isArray(unit?.topics) ? unit.topics : []

    return {
      id: unit?.id || `tp-u-${unitIndex + 1}`,
      name: unit?.name || `Unidad ${unitIndex + 1}`,
      topics: safeTopics.flatMap((topic: LegacyProgramTopic, topicIndex: number) => {
        if (Array.isArray(topic?.subtopics) && topic.subtopics.length > 0) {
          return topic.subtopics
            .map((subtopic, subIndex) => {
              const name = String(subtopic?.name || '').trim()
              if (!name) return null

              return {
                id: String(subtopic?.id || `tp-u-${unitIndex + 1}-t-${topicIndex + 1}-legacy-${subIndex + 1}`),
                name,
              }
            })
            .filter((value): value is ProgramTopic => value !== null)
        }

        const name = String(topic?.name || '').trim()
        if (!name) {
          return []
        }

        return [
          {
            id: String(topic?.id || `tp-u-${unitIndex + 1}-t-${topicIndex + 1}`),
            name,
          },
        ]
      }),
    }
  })
}

export function pedagogyProfileToContext(profile: PedagogyProfile): string {
  return [
    `Nivel: ${profile.level}`,
    `Carrera: ${profile.degree}`,
    `Ano: ${profile.academicYear}`,
    `Complejidad: ${profile.complexity}`,
    `Enfoque: ${profile.assessmentStyle}`,
    `Metodologia: ${profile.methodology}`,
  ].join('\n')
}

export function teacherProgramToSubject(program: TeacherProgram): Subject {
  const id = Number((program as TeacherProgram & { id?: number | string }).id) || 0
  const subjectName =
    (program as TeacherProgram & { subject_name?: string }).subjectName ||
    (program as TeacherProgram & { subject_name?: string }).subject_name ||
    'Materia docente'
  const pedagogyProfile =
    (program as TeacherProgram & { pedagogy_profile?: PedagogyProfile }).pedagogyProfile ||
    (program as TeacherProgram & { pedagogy_profile?: PedagogyProfile }).pedagogy_profile
  const iconName =
    (program as TeacherProgram & { iconName?: SubjectIconName; icon_name?: SubjectIconName }).iconName ||
    (program as TeacherProgram & { iconName?: SubjectIconName; icon_name?: SubjectIconName }).icon_name ||
    'book-open'
  const colorName =
    (program as TeacherProgram & { colorName?: SubjectColorName; color_name?: SubjectColorName }).colorName ||
    (program as TeacherProgram & { colorName?: SubjectColorName; color_name?: SubjectColorName }).color_name ||
    'teal'

  const normalizedUnits = normalizeUnits((program as TeacherProgram & { units: ProgramUnit[] | unknown }).units)

  return {
    id: `teacher-${id}`,
    name: subjectName,
    icon: iconName,
    color: colorName,
    progress: 0,
    source: 'teacher',
    programId: id,
    pedagogyProfile,
    units: normalizedUnits.map((unit) => ({
      id: unit.id,
      name: unit.name,
      topics: unit.topics.map((topic) => ({
        id: topic.id,
        name: topic.name,
        completed: false,
      })),
    })),
  }
}
