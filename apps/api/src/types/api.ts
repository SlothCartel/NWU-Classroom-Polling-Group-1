export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface JoinPollRequest {
  joinCode: string;
  securityCode?: string;
  studentNumber: string;
}

export interface SubmitAnswersRequest {
  pollId: string;
  answers: Array<{
    questionId: number;
    optionIndex: number;
  }>;
}
