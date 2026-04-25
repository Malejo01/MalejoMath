'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProgress, QuizConfig, QuizResult, Question, WeakPoint } from './types'

interface AppState {
  // User Progress
  userProgress: UserProgress
  
  // Current Quiz State
  currentQuiz: {
    config: QuizConfig | null
    questions: Question[]
    currentIndex: number
    answers: { questionId: string; selectedAnswer: number; isCorrect: boolean; topic: string }[]
    startedAt: string | null
  }
  
  // UI State
  activeView: 'dashboard' | 'selector' | 'quiz' | 'results'
  selectedSubject: string | null
  
  // Actions
  setActiveView: (view: 'dashboard' | 'selector' | 'quiz' | 'results') => void
  setSelectedSubject: (subject: string | null) => void
  startQuiz: (config: QuizConfig, questions: Question[]) => void
  answerQuestion: (questionId: string, selectedAnswer: number, isCorrect: boolean, topic: string) => void
  nextQuestion: () => void
  finishQuiz: () => QuizResult
  updateStreak: (passed: boolean) => void
  addWeakPoint: (topic: string, subject: string) => void
  removeWeakPoint: (topic: string) => void
  resetQuiz: () => void
}

const initialProgress: UserProgress = {
  streak: 0,
  lastAttemptDate: null,
  weakPoints: [],
  subjectProgress: {
    algebra: 0,
    analisis: 0,
    probabilidad: 0
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      userProgress: initialProgress,
      
      currentQuiz: {
        config: null,
        questions: [],
        currentIndex: 0,
        answers: [],
        startedAt: null
      },
      
      activeView: 'dashboard',
      selectedSubject: null,
      
      setActiveView: (view) => set({ activeView: view }),
      
      setSelectedSubject: (subject) => set({ selectedSubject: subject }),
      
      startQuiz: (config, questions) => set({
        currentQuiz: {
          config,
          questions,
          currentIndex: 0,
          answers: [],
          startedAt: new Date().toISOString()
        },
        activeView: 'quiz'
      }),
      
      answerQuestion: (questionId, selectedAnswer, isCorrect, topic) => set((state) => ({
        currentQuiz: {
          ...state.currentQuiz,
          answers: [
            ...state.currentQuiz.answers,
            { questionId, selectedAnswer, isCorrect, topic }
          ]
        }
      })),
      
      nextQuestion: () => set((state) => ({
        currentQuiz: {
          ...state.currentQuiz,
          currentIndex: state.currentQuiz.currentIndex + 1
        }
      })),
      
      finishQuiz: () => {
        const state = get()
        const { answers, questions, config } = state.currentQuiz
        const correct = answers.filter(a => a.isCorrect).length
        const total = questions.length
        const score = Number(((correct / total) * 10).toFixed(2))
        
        const incorrectTopics = [...new Set(
          answers.filter(a => !a.isCorrect).map(a => a.topic)
        )]
        
        // Update streak
        const passed = score >= 6
        get().updateStreak(passed)
        
        // Add weak points for incorrect answers
        if (config) {
          answers.filter(a => !a.isCorrect).forEach(a => {
            get().addWeakPoint(a.topic, config.subject)
          })
        }
        
        return {
          score,
          total,
          percentage: (correct / total) * 100,
          incorrectTopics,
          answers
        }
      },
      
      updateStreak: (passed) => set((state) => ({
        userProgress: {
          ...state.userProgress,
          streak: passed ? state.userProgress.streak + 1 : 0,
          lastAttemptDate: new Date().toISOString()
        }
      })),
      
      addWeakPoint: (topic, subject) => set((state) => {
        const existing = state.userProgress.weakPoints.find(wp => wp.topic === topic)
        if (existing) {
          return {
            userProgress: {
              ...state.userProgress,
              weakPoints: state.userProgress.weakPoints.map(wp =>
                wp.topic === topic ? { ...wp, count: wp.count + 1 } : wp
              )
            }
          }
        }
        return {
          userProgress: {
            ...state.userProgress,
            weakPoints: [...state.userProgress.weakPoints, { topic, subject, count: 1 }]
          }
        }
      }),
      
      removeWeakPoint: (topic) => set((state) => ({
        userProgress: {
          ...state.userProgress,
          weakPoints: state.userProgress.weakPoints.filter(wp => wp.topic !== topic)
        }
      })),
      
      resetQuiz: () => set({
        currentQuiz: {
          config: null,
          questions: [],
          currentIndex: 0,
          answers: [],
          startedAt: null
        },
        activeView: 'dashboard'
      })
    }),
    {
      name: 'malejo-math-storage'
    }
  )
)
