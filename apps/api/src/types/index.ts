export interface QuizOption {
  text: string;
  index: number; // A=0, B=1, C=2, D=3
}

export interface QuizQuestion {
  text: string;
  options: QuizOption[];
  correctIndex: number;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  joinCode: string;
  status: "draft" | "open" | "live" | "closed";
  timerSeconds: number;
  securityCode?: string;
  questions: QuizQuestion[];
  createdAt: Date;
}

export interface SubmissionFeedback {
  questionIndex: number;
  questionText: string;
  studentChoice: string;
  correctChoice: string;
  isCorrect: boolean;
}

export interface SubmitResult {
  score: number;
  total: number;
  feedback: SubmissionFeedback[];
}
