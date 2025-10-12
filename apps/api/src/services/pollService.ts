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
          create: data.questions.map((q) => ({
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
        questions: { include: { options: true } },
      },
    });

    return this.formatPollResponse(poll);
  }

  async getPollsByUser(userId: number) {
    const polls = await prisma.poll.findMany({
      where: { created_by: userId },
      include: {
        questions: { include: { options: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { created_at: "desc" },
    });

    return polls.map((poll) => ({
      ...this.formatPollResponse(poll),
      submissionCount: poll._count.submissions,
    }));
  }

  async getPollById(id: number, includeCorrectAnswers = false) {
    const poll = await prisma.poll.findUnique({
      where: { id },
      include: { questions: { include: { options: true } } },
    });
    if (!poll) throw new Error("Poll not found");

    const formatted = this.formatPollResponse(poll);
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
      include: { questions: { include: { options: true } } },
    });
    if (!poll) throw new Error("Poll not found");
    return this.formatPollResponse(poll);
  }

  async updatePollStatus(pollId: number, status: string, userId: number) {
    // Verify ownership
    const poll = await prisma.poll.findFirst({
      where: { id: pollId, created_by: userId },
    });
    if (!poll) throw new Error("Poll not found or access denied");

    const updated = await prisma.poll.update({
      where: { id: pollId },
      data: { status },
      include: { questions: { include: { options: true } } },
    });
    return this.formatPollResponse(updated);
  }

async deletePoll(pollId: number, userId: number) {
  // Verify ownership
  const poll = await prisma.poll.findFirst({
    where: { id: pollId, created_by: userId },
    select: { id: true },
  });
  if (!poll) throw new Error("Poll not found or access denied");

  await prisma.$transaction(async (tx) => {
    // 1) Questions for this poll
    const qids = (
      await tx.question.findMany({
        where: { poll_id: pollId },
        select: { id: true },
      })
    ).map((q) => q.id);

    // 2) Delete per-question children
    if (qids.length > 0) {
      await tx.vote.deleteMany({ where: { question_id: { in: qids } } });
      await tx.answer.deleteMany({ where: { question_id: { in: qids } } });
      await tx.option.deleteMany({ where: { question_id: { in: qids } } });
      await tx.question.deleteMany({ where: { id: { in: qids } } });
    }

    // 3) Delete submissions (+ answers by submission_id)
    const sids = (
      await tx.submission.findMany({
        where: { poll_id: pollId },
        select: { id: true },
      })
    ).map((s) => s.id);

    if (sids.length > 0) {
      await tx.answer.deleteMany({ where: { submission_id: { in: sids } } });
      await tx.submission.deleteMany({ where: { id: { in: sids } } });
    }

    // 4) ✅ Delete lobby entries (this is the FK causing your error)
    await tx.lobbyEntry.deleteMany({ where: { poll_id: pollId } });

    // 5) Delete analytics
    await tx.analytics.deleteMany({ where: { poll_id: pollId } });

    // 6) Finally delete the poll
    await tx.poll.delete({ where: { id: pollId } });
  });
}

  // ---------- helpers ----------
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
        id: q.id, // keep DB id for mapping answers
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
  /**
   * Update poll meta (title/timer/security) and optionally REPLACE questions.
   * For safety, question edits are blocked if submissions already exist.
   */
  async updatePoll(
    pollId: number,
    userId: number,
    data: {
      title?: string;
      timerSeconds?: number;
      securityCode?: string | null;
      questions?: QuizQuestion[]; // full replacement if provided
    }
  ) {
    // Verify ownership
    const poll = await prisma.poll.findFirst({
      where: { id: pollId, created_by: userId },
      include: {
        _count: { select: { submissions: true } },
        questions: { select: { id: true } },
      },
    });
    if (!poll) throw new Error("Poll not found or access denied");

    // 1) Update basic meta first
    const meta = await prisma.poll.update({
      where: { id: pollId },
      data: {
        title: data.title ?? undefined,
        timerSeconds: data.timerSeconds ?? undefined,
        securityCode:
          data.securityCode === null
            ? null
            : data.securityCode ?? undefined,
      },
    });

    // 2) If questions provided -> full replace
    if (data.questions) {
      // Safety: block question edits if any submissions exist
      if (poll._count.submissions > 0) {
        throw new Error("Cannot edit questions after students have submitted");
      }

      await prisma.$transaction(async (tx) => {
        const qids = poll.questions.map((q) => q.id);
        if (qids.length) {
          await tx.option.deleteMany({ where: { question_id: { in: qids } } });
          await tx.question.deleteMany({ where: { id: { in: qids } } });
        }

        // Recreate questions + options
        if (data.questions.length) {
          await tx.question.createMany({
            data: data.questions.map((q, i) => ({
              poll_id: pollId,
              question_text: q.text,
              question_type: "multiple_choice",
              correctIndex: q.correctIndex,
              // prisma.createMany can't do nested creates; create options below
            })),
          });

          // fetch newly created questions (ordered by id)
          const createdQs = await tx.question.findMany({
            where: { poll_id: pollId },
            orderBy: { id: "asc" },
            select: { id: true },
          });

          // Flatten options with matching indices
          const optionRows: { question_id: number; option_text: string; optionIndex: number }[] =
            [];
          createdQs.forEach((dbQ, idx) => {
            const srcQ = data.questions![idx];
            srcQ.options.forEach((opt) => {
              optionRows.push({
                question_id: dbQ.id,
                option_text: opt.text,
                optionIndex: opt.index,
              });
            });
          });

          if (optionRows.length) {
            await tx.option.createMany({ data: optionRows });
          }
        }
      });
    }

    // Return fresh formatted poll
    const updated = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { questions: { include: { options: true } } },
    });
    return this.formatPollResponse(updated!);
  }
}

// Export both the class and an instance
export const pollService = new PollService();
