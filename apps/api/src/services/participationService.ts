// apps/api/src/services/participationService.ts
import { prisma } from "../config/database";
import { POLL_STATUS } from "../utils/constants";

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
    optionIndex: number; // may arrive as number or string; we'll coerce
  }>;
}

export class ParticipationService {
  async joinPoll(data: JoinPollData) {
    const poll = await prisma.poll.findUnique({
      where: { joinCode: data.joinCode },
      include: { questions: { include: { options: true } } },
    });
    if (!poll) throw new Error("Poll not found");
    if (poll.status !== POLL_STATUS.OPEN && poll.status !== POLL_STATUS.LIVE) {
      throw new Error("Poll is not open for joining");
    }
    if (poll.securityCode && poll.securityCode !== data.securityCode) {
      throw new Error("Invalid security code");
    }
    const user = await prisma.user.findUnique({
      where: { studentNumber: data.studentNumber },
      select: { id: true },
    });
    if (!user) throw new Error("Student not found");

    return {
      id: poll.id.toString(),
      title: poll.title,
      description: poll.description,
      status: poll.status,
      timerSeconds: poll.timerSeconds,
      questions: poll.questions.map((q) => ({
        id: q.id,
        text: q.question_text,
        options: q.options
          .sort((a, b) => a.optionIndex - b.optionIndex)
          .map((opt) => ({ text: opt.option_text, index: opt.optionIndex })),
      })),
    };
  }

  async submitAnswers(data: SubmitAnswersData) {
    const poll = await prisma.poll.findUnique({
      where: { id: data.pollId },
      include: {
        questions: {
          orderBy: { id: "asc" }, // position-based grading
          include: { options: true },
        },
      },
    });
    if (!poll) throw new Error("Poll not found");

    if (poll.status !== POLL_STATUS.LIVE && poll.status !== POLL_STATUS.CLOSED) {
      throw new Error("Poll is not accepting submissions");
    }

    const total = poll.questions.length;

    const qById = new Map<
      number,
      { id: number; correctIndex: number | null; options: { id: number; optionIndex: number }[] }
    >();
    for (const q of poll.questions) {
      qById.set(q.id, {
        id: q.id,
        correctIndex: q.correctIndex ?? null,
        options: q.options.map((o) => ({ id: o.id, optionIndex: o.optionIndex })),
      });
    }

    let score = 0;
    const answerRows: { question_id: number; option_id: number | null; is_correct: boolean | null }[] = [];

    for (let i = 0; i < total; i++) {
      const q = poll.questions[i];              // authoritative question at position i
      const submitted = data.answers[i];        // answer at same position (may be undefined)

      // ✅ Coerce optionIndex safely (string → number), default to -1 for NaN
      const optionIdx = submitted != null
        ? Number.isFinite(Number(submitted.optionIndex))
          ? parseInt(String(submitted.optionIndex), 10)
          : -1
        : -1;

      if (optionIdx < 0) {
        answerRows.push({ question_id: q.id, option_id: null, is_correct: null });
        continue;
      }

      const opt = q.options.find((o) => o.optionIndex === optionIdx) || null;
      const isCorrect =
        q.correctIndex == null || opt == null ? null : q.correctIndex === optionIdx;
      if (isCorrect === true) score += 1;

      answerRows.push({
        question_id: q.id,
        option_id: opt ? opt.id : null,
        is_correct: isCorrect,
      });
    }

    const submission = await prisma.$transaction(async (tx) => {
      const sub = await tx.submission.upsert({
        where: { poll_id_user_id: { poll_id: data.pollId, user_id: data.userId } },
        update: { score, total },
        create: { poll_id: data.pollId, user_id: data.userId, score, total },
        select: { id: true, score: true, total: true },
      });

      await tx.answer.deleteMany({ where: { submission_id: sub.id } });
      if (answerRows.length > 0) {
        await tx.answer.createMany({
          data: answerRows.map((r) => ({
            submission_id: sub.id,
            question_id: r.question_id,
            option_id: r.option_id,
            is_correct: r.is_correct,
          })),
        });
      }

      return sub;
    });

    return { score: submission.score, total: submission.total };
  }

  async getLobbyStudents(pollId: number) {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { submissions: { include: { user: true } } },
    });
    if (!poll) throw new Error("Poll not found");

    return poll.submissions.map((sub) => ({
      id: sub.user.id,
      name: sub.user.name,
      studentNumber: sub.user.studentNumber,
      joinedAt: sub.submitted_at,
    }));
  }

  async kickStudentFromLobby(pollId: number, studentNumber: string) {
    const user = await prisma.user.findUnique({
      where: { studentNumber },
      select: { id: true },
    });
    if (!user) throw new Error("Student not found");

    await prisma.$transaction(async (tx) => {
      const sub = await tx.submission.findUnique({
        where: { poll_id_user_id: { poll_id: pollId, user_id: user.id } },
        select: { id: true },
      });
      if (sub) {
        await tx.answer.deleteMany({ where: { submission_id: sub.id } });
        await tx.submission.delete({ where: { id: sub.id } });
      }
    });

    return { success: true, message: "Student removed from poll" };
  }
}

export const participationService = new ParticipationService();