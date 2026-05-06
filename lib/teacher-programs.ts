import type {
  PedagogyProfile,
  Subject,
  TeacherProgram,
  ProgramUnit,
  ProgramTopic,
  ProgramSubtopic,
} from '@/lib/types'

function normalizeSubtopics(topic: ProgramTopic): ProgramSubtopic[] {
  if (Array.isArray(topic.subtopics) && topic.subtopics.length > 0) {
    return topic.subtopics
  }

  return [
    {
      id: `${topic.id}-s-1`,
      name: topic.name,
    },
  ]
}

function normalizeUnits(units: ProgramUnit[] | unknown): ProgramUnit[] {
  if (!Array.isArray(units)) {
    return []
  }

  return units.map((unit, unitIndex) => {
    const safeTopics = Array.isArray(unit?.topics) ? unit.topics : []

    return {
      id: unit?.id || `tp-u-${unitIndex + 1}`,
      name: unit?.name || `Unidad ${unitIndex + 1}`,
      topics: safeTopics.map((topic: ProgramTopic, topicIndex: number) => ({
        id: topic?.id || `tp-u-${unitIndex + 1}-t-${topicIndex + 1}`,
        name: topic?.name || `Tema ${topicIndex + 1}`,
        subtopics: normalizeSubtopics(topic),
      })),
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
  const normalizedUnits = normalizeUnits(program.units)

  return {
    id: `teacher-${program.id}`,
    name: program.subjectName,
    icon: 'teacher',
    color: 'teacher',
    progress: 0,
    source: 'teacher',
    programId: program.id,
    pedagogyProfile: program.pedagogyProfile,
    units: normalizedUnits.map((unit) => ({
      id: unit.id,
      name: unit.name,
      topics: unit.topics.flatMap((topic) =>
        normalizeSubtopics(topic).map((subtopic) => ({
          id: subtopic.id,
          name: subtopic.name,
          group: topic.name,
          completed: false,
        }))
      ),
    })),
  }
}
