// API envelope from backend
export interface ApiOk<T> { success: true; data: T; }

// ===== UI shapes your pages use =====
export type ChoiceLabel = "A" | "B" | "C" | "D";
export interface QuizOption { label: ChoiceLabel; text: string; }
export interface QuizQuestion { text: string; options: QuizOption[]; correctIndex: number; }

export interface Poll {
  id: string;
  title: string;
  description?: string | null;
  joinCode: string;
  status: "draft" | "open" | "live" | "closed";
  timerSeconds: number;
  securityCode?: string | null;
  createdAt?: string;
  questions: QuizQuestion[];
}

export interface StudentPoll {
  id: string;
  title: string;
  status: "open" | "live" | "closed" | "draft";
  timerSeconds: number;
  questions: Array<{
    id?: number;
    text: string;
    correctIndex: number;
    options: QuizOption[];
  }>;
}

export interface SubmitResultUI {
  score: number;
  total: number;
  feedback: Array<{
    qIndex: number;
    question: string;
    options: QuizOption[];
    chosenIndex: number;
    correctIndex: number;
    correct: boolean;
  }>;
}

// --- Step 3: keep backward compatibility with pages that import `SubmitResult`
export type SubmitResult = SubmitResultUI;

// --- Step 4: widen the stored submission shape to match what StudentPage.tsx reads
export interface StoredSubmission {
  pollId: string;

  // Your page sometimes reads these:
  title?: string;               // optional for compatibility
  joinCode?: string;            // optional for compatibility

  // Some code used pollTitle previously
  pollTitle?: string;

  score: number;
  total: number;
  percentage: number;
  submittedAt: string;

  // Backend history returns minimal feedback; your UI sometimes renders richer fields.
  // Make them optional so TS accepts your current page code without UI changes.
  feedback: Array<{
    // Minimal from API:
    questionText: string;
    studentChoice?: string;
    isCorrect?: boolean;

    // Extra fields used by UI:
    qIndex?: number;
    options?: QuizOption[];
    chosenIndex?: number;
    correctIndex?: number;
    correct?: boolean;
  }>;
}

// ===== Server shapes (match backend docs) =====
export interface ServerPollOption { option_text: string; optionIndex: number; }
export interface ServerPollQuestion {
  id?: number;
  question_text: string;
  question_type?: string;
  correctIndex?: number;
  options: ServerPollOption[];
}
export interface ServerPoll {
  id: number | string;
  title: string;
  description?: string | null;
  joinCode: string;
  status: string;
  timerSeconds: number;
  securityCode?: string | null;
  createdAt?: string;
  questions: ServerPollQuestion[];
}

export interface ServerStats {
  pollId: number;
  title: string;
  status: string;
  totalSubmissions: number;
  averageScore: number;
  averagePercentage: number;
  questions: Array<{
    questionId: number;
    questionText: string;
    totalAnswers: number;
    correctAnswers: number;
    correctPercentage: number;
    options: Array<{ text: string; index: number; count: number; percentage: number; isCorrect: boolean }>;
  }>;
}
