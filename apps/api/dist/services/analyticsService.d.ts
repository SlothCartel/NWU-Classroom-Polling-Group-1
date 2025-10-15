export declare class AnalyticsService {
    getStudentSubmissionHistory(studentNumber: string): Promise<{
        pollId: string;
        title: string;
        pollTitle: string;
        joinCode: string;
        submittedAt: Date;
        score: number;
        total: number;
        feedback: {
            qIndex: number;
            question: string;
            options: {
                label: string;
                text: string;
            }[];
            chosenIndex: number;
            correctIndex: number;
            correct: boolean;
        }[];
    }[]>;
    deleteStudentSubmission(studentNumber: string, pollId: number): Promise<{
        success: boolean;
        message: string;
    }>;
    getPollStats(pollId: number): Promise<{
        attendees: string[];
        questions: {
            questionText: string;
            totalAnswers: number;
            correctAnswers: number;
            incorrect: number;
            notAnswered: number;
        }[];
    }>;
    exportPollCsv(pollId: number): Promise<string>;
}
export declare const analyticsService: AnalyticsService;
//# sourceMappingURL=analyticsService.d.ts.map