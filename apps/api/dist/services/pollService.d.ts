import { QuizQuestion } from "../types";
export interface CreatePollData {
    title: string;
    description?: string;
    questions: QuizQuestion[];
    timerSeconds?: number;
    securityCode?: string;
    createdBy: number;
}
export declare class PollService {
    createPoll(data: CreatePollData): Promise<{
        id: any;
        title: any;
        description: any;
        joinCode: any;
        status: any;
        timerSeconds: any;
        securityCode: any;
        createdAt: any;
        questions: any;
    }>;
    getPollsByUser(userId: number): Promise<{
        submissionCount: number;
        id: any;
        title: any;
        description: any;
        joinCode: any;
        status: any;
        timerSeconds: any;
        securityCode: any;
        createdAt: any;
        questions: any;
    }[]>;
    getPollById(id: number, includeCorrectAnswers?: boolean): Promise<{
        id: any;
        title: any;
        description: any;
        joinCode: any;
        status: any;
        timerSeconds: any;
        securityCode: any;
        createdAt: any;
        questions: any;
    }>;
    getPollByJoinCode(joinCode: string): Promise<{
        id: any;
        title: any;
        description: any;
        joinCode: any;
        status: any;
        timerSeconds: any;
        securityCode: any;
        createdAt: any;
        questions: any;
    }>;
    updatePollStatus(pollId: number, status: string, userId: number): Promise<{
        id: any;
        title: any;
        description: any;
        joinCode: any;
        status: any;
        timerSeconds: any;
        securityCode: any;
        createdAt: any;
        questions: any;
    }>;
    deletePoll(pollId: number, userId: number): Promise<void>;
    private formatPollResponse;
    /**
     * Update poll meta (title/timer/security) and optionally REPLACE questions.
     * For safety, question edits are blocked if submissions already exist.
     */
    updatePoll(pollId: number, userId: number, data: {
        title?: string;
        timerSeconds?: number;
        securityCode?: string | null;
        questions?: QuizQuestion[];
    }): Promise<{
        id: any;
        title: any;
        description: any;
        joinCode: any;
        status: any;
        timerSeconds: any;
        securityCode: any;
        createdAt: any;
        questions: any;
    }>;
}
export declare const pollService: PollService;
//# sourceMappingURL=pollService.d.ts.map