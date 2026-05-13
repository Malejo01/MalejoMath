import { convertQuizToGift } from './lib/moodle-export'

const quiz = {
  subjectName: 'Math',
  selectedTopics: [{ id: '1', name: 'Equations' }],
  questions: [
    {
      id: 'q1',
      topic: 'Equations',
      topicName: 'Equations',
      question: 'Solve for x.',
      options: ['{3, -\\\\frac{5}{3}}', '{1, 2}', '{0}', '{-1}'],
      correctAnswer: 0,
      explanation: 'Check the roots.'
    }
  ]
}

try {
  const result = convertQuizToGift(quiz as any);
  process.stdout.write(result);
} catch (e: any) {
  console.error(e.message)
}
