// src/lib/types.ts

// Choice labels for options
export type ChoiceLabel = 'A' | 'B' | 'C' | 'D'

// An option in a multiple-choice question
export type QuizOption = {
  label: ChoiceLabel
  text: string
}

// A quiz question (admin/editor view includes the correct index)
export type QuizQuestion = {
  text: string
  options: QuizOption[]
  correctIndex: number
}

// Poll lifecycle
export type PollStatus = 'draft' | 'open' | 'live' | 'closed'

// Full poll shape stored by the app (admin side)
export type Poll = {
  id: string
  joinCode: string
  title: string
  status: PollStatus
  questions: QuizQuestion[]        // includes correctIndex
  timerSeconds: number
  securityCode?: string
}

// Student-facing poll (no correct answers exposed)
export type StudentPoll = {
  id: string
  joinCode: string
  title: string
  status: 'open' | 'live' | 'closed'
  timerSeconds: number
  questions: Array<{
    text: string
    options: QuizOption[]
  }>
}

// ===== Results / Feedback after submission =====

export type SubmissionFeedback = {
  qIndex: number
  question: string
  chosenIndex: number
  correctIndex: number
  correct: boolean
  options: QuizOption[]
}

export type SubmitResult = {
  score: number
  total: number
  feedback: SubmissionFeedback[]
}

// ===== Stored submission for Student Dashboard =====
export type StoredSubmission = {
  pollId: string
  studentNumber: string
  submittedAt: number // epoch ms
  title: string
  joinCode: string
  score: number
  total: number
  feedback: SubmissionFeedback[]
}
