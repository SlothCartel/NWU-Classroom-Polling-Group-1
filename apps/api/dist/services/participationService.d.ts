export interface JoinPollData {
    joinCode: string;
    securityCode?: string;
    studentNumber: string;
}
export interface SubmitAnswersData {
    pollId: number;
    userId: number;
    answers: Array<{
        questionId?: number;
        optionIndex: number;
    }>;
}
export declare class ParticipationService {
    joinPoll(data: JoinPollData): Promise<{
        id: string;
        title: string;
        description: string;
        status: "open" | "live";
        timerSeconds: number;
        questions: {
            id: number;
            text: string;
            options: {
                text: string;
                index: number;
            }[];
        }[];
    }>;
    recordLiveChoice(params: {
        pollId: number;
        userId: number;
        questionId: number;
        optionIndex: number;
    }): Promise<{
        success: boolean;
    }>;
    submitAnswers(data: SubmitAnswersData): Promise<{
        score: number;
        total: number;
    }>;
    getLobbyStudents(pollId: number): Promise<{
        id: number;
        name: string;
        studentNumber: string;
        joinedAt: Date;
    }[]>;
    kickStudentFromLobby(pollId: number, studentNumber: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
export declare const participationService: ParticipationService;
//# sourceMappingURL=participationService.d.ts.map