// === Shared types for Admin + API client ===

export type ChoiceLabel = 'A' | 'B' | 'C' | 'D'

export type QuizOption = {
  label: ChoiceLabel        // "A" | "B" | "C" | "D"
  text: string              // option text shown to students
}

export type QuizQuestion = {
  text: string              // question text
  options: QuizOption[]     // exactly 4, A–D, ordered
  correctIndex: number      // 0..3  (LECTURER/ADMIN ONLY – never send to students)
}

export type PollStatus = 'draft' | 'live' | 'closed'

export type Poll = {
  id: string
  joinCode: string
  title: string             // overall poll/quiz title
  status: PollStatus
  questions: QuizQuestion[] // 1..5 questions
  timerSeconds: number      // total time allowed to answer (server-enforced)
  securityCode?: string     // optional extra code required to join/submit
}
