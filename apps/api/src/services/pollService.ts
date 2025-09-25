import { prisma } from "../config/database";
import { generateJoinCode } from "../utils/generateCodes";
import { POLL_STATUS } from "../utils/constants";
import { QuizQuestion } from "../types";

export interface CreatePollData {
  title: string;
  description?: string;
  questions: QuizQuestion[];
  timerSeconds?: number;
  securityCode?: string;
  createdBy: number;
}

export class PollService {
  async createPoll(data: CreatePollData) {
    const joinCode = generateJoinCode();

    const poll = await prisma.poll.create({
      data: {
        title: data.title,
        description: data.description,
        joinCode,
        status: POLL_STATUS.DRAFT,
        timerSeconds: data.timerSeconds || 30,
        securityCode: data.securityCode,
        created_by: data.createdBy,
        questions: {
          create: data.questions.map((q, _index) => ({
            question_text: q.text,
            question_type: "multiple_choice",
            correctIndex: q.correctIndex,
            options: {
              create: q.options.map((option) => ({
                option_text: option.text,
                optionIndex: option.index,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    return this.formatPollResponse(poll);
  }

  async getPollsByUser(userId: number) {
    const polls = await prisma.poll.findMany({
      where: { created_by: userId },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return polls.map((poll) => ({
      ...this.formatPollResponse(poll),
      submissionCount: poll._count.submissions,
    }));
  }

  async getPollById(id: number, includeCorrectAnswers: boolean = false) {
    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!poll) {
      throw new Error("Poll not found");
    }

    const formatted = this.formatPollResponse(poll);

    // Remove correct answers for students
    if (!includeCorrectAnswers) {
      formatted.questions = formatted.questions.map((q) => ({
        ...q,
        correctIndex: undefined,
      }));
    }

    return formatted;
  }

  async getPollByJoinCode(joinCode: string) {
    const poll = await prisma.poll.findUnique({
      where: { joinCode },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!poll) {
      throw new Error("Poll not found");
    }

    return this.formatPollResponse(poll);
  }

  async updatePollStatus(pollId: number, status: string, userId: number) {
    // Verify ownership
    const poll = await prisma.poll.findFirst({
      where: {
        id: pollId,
        created_by: userId,
      },
    });

    if (!poll) {
      throw new Error("Poll not found or access denied");
    }

    const updatedPoll = await prisma.poll.update({
      where: { id: pollId },
      data: { status },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    return this.formatPollResponse(updatedPoll);
  }

  async deletePoll(pollId: number, userId: number) {
    // Verify ownership
    const poll = await prisma.poll.findFirst({
      where: {
        id: pollId,
        created_by: userId,
      },
    });

    if (!poll) {
      throw new Error("Poll not found or access denied");
    }

    await prisma.poll.delete({
      where: { id: pollId },
    });
  }

  private formatPollResponse(poll: any) {
    return {
      id: poll.id.toString(),
      title: poll.title,
      description: poll.description,
      joinCode: poll.joinCode,
      status: poll.status,
      timerSeconds: poll.timerSeconds,
      securityCode: poll.securityCode,
      createdAt: poll.created_at,
      questions: poll.questions.map((q: any) => ({
        text: q.question_text,
        correctIndex: q.correctIndex,
        options: q.options
          .sort((a: any, b: any) => a.optionIndex - b.optionIndex)
          .map((opt: any) => ({
            text: opt.option_text,
            index: opt.optionIndex,
          })),
      })),
    };
  }
}

// Export both the class and an instance
export const pollService = new PollService();
