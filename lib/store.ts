'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { normalizeQuestions } from './normalize-questions'
import type {
  UserProgress,
  QuizConfig,
  QuizResult,
  Question,
  Answer,
  TeacherProgram,
  TeacherProgramFilters,
  TeacherQuiz,
  UserProfile,
  UserRole,
} from './types'

interface AppState {
  // User Progress
  userProgress: UserProgress
  userProfile: UserProfile | null
  teacherPrograms: TeacherProgram[]
  teacherQuizzes: TeacherQuiz[]
  teacherProgramFilters: TeacherProgramFilters
  teacherSection: 'materias' | 'crear' | 'cuestionarios' | 'aulas'
  
  // Current Quiz State
  currentQuiz: {
    config: QuizConfig | null
    questions: Question[]
    currentIndex: number
    answers: Answer[]
    startedAt: string | null
  }
  
  // UI State
  activeView: 'dashboard' | 'selector' | 'quiz' | 'results' | 'loading'
  selectedSubject: string | null
  selectedTopics: { id: string; name: string }[]
  
  // Actions
  setActiveView: (view: 'dashboard' | 'selector' | 'quiz' | 'results' | 'loading') => void
  setSelectedSubject: (subject: string | null) => void
  toggleTopic: (topicId: string, topicName: string) => void
  clearSelectedTopics: () => void
  startQuiz: (config: QuizConfig, questions: Question[]) => void
  startQuizPreview: (config: QuizConfig, questions: Question[]) => void
  answerQuestion: (answer: Answer) => void
  nextQuestion: () => void
  previousQuestion: () => void
  finishQuiz: () => QuizResult
  updateStreak: (passed: boolean) => void
  updateSubjectAverage: (subject: string, score: number) => void
  addWeakPoint: (topic: string, topicName: string, subject: string, nivel?: string, grado?: string, misconceptionType?: string) => void
  removeWeakPoint: (topic: string) => void
  addUsedQuestionIds: (ids: string[]) => void
  resetQuiz: () => void
  getUsedQuestionIds: () => string[]
  updateQuestions: (questions: Question[]) => void
  setUserProfile: (profile: UserProfile | null) => void
  setUserRole: (role: UserRole) => void
  setTeacherPrograms: (programs: TeacherProgram[]) => void
  addTeacherProgram: (program: TeacherProgram) => void
  updateTeacherProgram: (programId: number, updates: Partial<TeacherProgram>) => void
  removeTeacherProgram: (programId: number) => void
  setTeacherQuizzes: (quizzes: TeacherQuiz[]) => void
  addTeacherQuiz: (quiz: TeacherQuiz) => void
  updateTeacherQuiz: (quizId: number, updates: Partial<TeacherQuiz>) => void
  removeTeacherQuiz: (quizId: number) => void
  setTeacherProgramFilters: (filters: Partial<TeacherProgramFilters>) => void
  setTeacherSection: (section: 'materias' | 'crear' | 'cuestionarios' | 'aulas') => void
}

const initialProgress: UserProgress = {
  streak: 0,
  lastAttemptDate: null,
  weakPoints: [],
  subjectProgress: {},
  subjectAverages: {},
  subjectAttemptCounts: {},
  usedQuestionIds: []
}

const initialTeacherProgramFilters: TeacherProgramFilters = {
  name: '',
  level: '',
  degree: '',
  mode: '',
  createdAfter: '',
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      userProgress: initialProgress,
      userProfile: null,
      teacherPrograms: [],
      teacherQuizzes: [],
      teacherProgramFilters: initialTeacherProgramFilters,
      teacherSection: 'materias',
      
      currentQuiz: {
        config: null,
        questions: [],
        currentIndex: 0,
        answers: [],
        startedAt: null
      },
      
      activeView: 'dashboard',
      selectedSubject: null,
      selectedTopics: [],
      
      setActiveView: (view) => set({ activeView: view }),
      
      setSelectedSubject: (subject) => {
        const state = get()
        // Only clear topics if changing to a different subject
        if (state.selectedSubject !== subject) {
          set({ 
            selectedSubject: subject,
            selectedTopics: []
          })
        } else {
          set({ selectedSubject: subject })
        }
      },
      
      toggleTopic: (topicId, topicName) => set((state) => {
        const exists = state.selectedTopics.find(t => t.id === topicId)
        if (exists) {
          return { selectedTopics: state.selectedTopics.filter(t => t.id !== topicId) }
        }
        return { selectedTopics: [...state.selectedTopics, { id: topicId, name: topicName }] }
      }),
      
      clearSelectedTopics: () => set({ selectedTopics: [] }),
      
      startQuiz: (config, questions) => set({
        currentQuiz: {
          config,
          questions: normalizeQuestions(questions),
          currentIndex: 0,
          answers: [],
          startedAt: new Date().toISOString()
        },
        activeView: 'quiz'
      }),

      startQuizPreview: (config, questions) => set({
        currentQuiz: {
          config: { ...config, previewOnly: true },
          questions: normalizeQuestions(questions),
          currentIndex: 0,
          answers: [],
          startedAt: null
        },
        activeView: 'quiz'
      }),
      
      answerQuestion: (answer) => set((state) => ({
        currentQuiz: {
          ...state.currentQuiz,
          answers: [...state.currentQuiz.answers, answer]
        }
      })),
      
      nextQuestion: () => set((state) => ({
        currentQuiz: {
          ...state.currentQuiz,
          currentIndex: state.currentQuiz.currentIndex + 1
        }
      })),

      previousQuestion: () => set((state) => ({
        currentQuiz: {
          ...state.currentQuiz,
          currentIndex: Math.max(0, state.currentQuiz.currentIndex - 1)
        }
      })),
      
      finishQuiz: () => {
        const state = get()
        const { answers, questions, config } = state.currentQuiz
        const correctAnswers = answers.filter(a => a.isCorrect)
        const incorrectAnswers = answers.filter(a => !a.isCorrect)
        const correct = correctAnswers.length
        const total = questions.length
        const score = Number(((correct / total) * 10).toFixed(2))
        
        const incorrectTopics = [...new Set(incorrectAnswers.map(a => a.topic))]
        
        // Update streak
        const passed = score >= 6
        get().updateStreak(passed)
        
        // Add weak points for incorrect answers
        if (config) {
          get().updateSubjectAverage(config.subject, score)

          incorrectAnswers.forEach(a => {
            get().addWeakPoint(a.topic, a.topicName, config.subject)
          })
        }
        
        // Store used question IDs
        get().addUsedQuestionIds(questions.map(q => q.id))
        
        return {
          score,
          total,
          percentage: (correct / total) * 100,
          incorrectTopics,
          answers,
          correctAnswers,
          incorrectAnswers
        }
      },
      
      updateStreak: (passed) => set((state) => ({
        userProgress: {
          ...state.userProgress,
          streak: passed ? state.userProgress.streak + 1 : 0,
          lastAttemptDate: new Date().toISOString()
        }
      })),

      updateSubjectAverage: (subject, score) => set((state) => {
        const currentAverages = state.userProgress.subjectAverages ?? initialProgress.subjectAverages
        const currentAttempts = state.userProgress.subjectAttemptCounts ?? initialProgress.subjectAttemptCounts
        const previousAttempts = currentAttempts[subject] ?? 0
        const previousAverage = currentAverages[subject] ?? 0
        const nextAttempts = previousAttempts + 1
        const nextAverage = Number((((previousAverage * previousAttempts) + score) / nextAttempts).toFixed(2))

        return {
          userProgress: {
            ...state.userProgress,
            subjectAverages: {
              ...currentAverages,
              [subject]: nextAverage
            },
            subjectAttemptCounts: {
              ...currentAttempts,
              [subject]: nextAttempts
            }
          }
        }
      }),
      
      addWeakPoint: (topic, topicName, subject, nivel, grado, misconceptionType) => set((state) => {
        const existing = state.userProgress.weakPoints.find(wp => wp.topic === topic)
        if (existing) {
          return {
            userProgress: {
              ...state.userProgress,
              weakPoints: state.userProgress.weakPoints.map(wp =>
                wp.topic === topic ? {
                  ...wp,
                  count: wp.count + 1,
                  nivel: nivel || wp.nivel,
                  grado: grado || wp.grado,
                  misconceptionType: misconceptionType || wp.misconceptionType
                } : wp
              )
            }
          }
        }
        return {
          userProgress: {
            ...state.userProgress,
            weakPoints: [...state.userProgress.weakPoints, { topic, topicName, subject, count: 1, nivel, grado, misconceptionType }]
          }
        }
      }),
      
      removeWeakPoint: (topic) => set((state) => ({
        userProgress: {
          ...state.userProgress,
          weakPoints: state.userProgress.weakPoints.filter(wp => wp.topic !== topic && wp.topicName !== topic)
        }
      })),
      
      addUsedQuestionIds: (ids) => set((state) => ({
        userProgress: {
          ...state.userProgress,
          usedQuestionIds: [...new Set([...state.userProgress.usedQuestionIds, ...ids])]
        }
      })),
      
      getUsedQuestionIds: () => get().userProgress.usedQuestionIds,
      
      resetQuiz: () => set({
        currentQuiz: {
          config: null,
          questions: [],
          currentIndex: 0,
          answers: [],
          startedAt: null
        },
        activeView: 'dashboard',
        selectedSubject: null,
        selectedTopics: []
      }),
      
      updateQuestions: (questions) => set((state) => ({
        currentQuiz: {
          ...state.currentQuiz,
          questions
        }
      })),

      setUserProfile: (profile) => set({ userProfile: profile }),

      setUserRole: (role) => set((state) => ({
        userProfile: state.userProfile
          ? { ...state.userProfile, role }
          : {
              id: '',
              email: '',
              displayName: '',
              role,
            },
      })),

      setTeacherPrograms: (programs) => set({ teacherPrograms: programs }),

      addTeacherProgram: (program) => set((state) => ({
        teacherPrograms: [program, ...state.teacherPrograms],
      })),

      updateTeacherProgram: (programId, updates) => set((state) => ({
        teacherPrograms: state.teacherPrograms.map((program) =>
          program.id === programId ? { ...program, ...updates } : program
        ),
      })),

      removeTeacherProgram: (programId) => set((state) => ({
        teacherPrograms: state.teacherPrograms.filter((program) => program.id !== programId),
        teacherQuizzes: state.teacherQuizzes.filter((quiz) => quiz.teacherProgramId !== programId),
      })),

      setTeacherQuizzes: (quizzes) => set({ teacherQuizzes: quizzes }),

      addTeacherQuiz: (quiz) => set((state) => ({
        teacherQuizzes: [quiz, ...state.teacherQuizzes],
      })),

      updateTeacherQuiz: (quizId, updates) => set((state) => ({
        teacherQuizzes: state.teacherQuizzes.map((quiz) =>
          quiz.id === quizId ? { ...quiz, ...updates } : quiz
        ),
      })),

      removeTeacherQuiz: (quizId) => set((state) => ({
        teacherQuizzes: state.teacherQuizzes.filter((quiz) => quiz.id !== quizId),
      })),

      setTeacherProgramFilters: (filters) => set((state) => ({
        teacherProgramFilters: {
          ...state.teacherProgramFilters,
          ...filters,
        },
      })),

      setTeacherSection: (section) => set({ teacherSection: section }),
    }),
    {
      name: 'maestria-storage',
      partialize: (state) => ({ 
        userProgress: state.userProgress 
      }), // Solo persistir el progreso del usuario, NO el quiz actual
    }
  )
)
