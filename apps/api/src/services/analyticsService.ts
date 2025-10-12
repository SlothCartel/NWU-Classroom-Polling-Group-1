import { prisma } from "../config/database";

const LABELS = ["A", "B", "C", "D"] as const;

export class AnalyticsService {
  /**
   * Student history – unchanged; still based on saved submissions.
   */
  async getStudentSubmissionHistory(studentNumber: string) {
    const user = await prisma.user.findUnique({
      where: { studentNumber },
      select: { id: true },
    });
    if (!user) return [];

    const subs = await prisma.submission.findMany({
      where: { user_id: user.id },
      orderBy: { submitted_at: "desc" },
      include: {
        poll: {
          select: {
            id: true,
            title: true,
            joinCode: true,
            questions: {
              orderBy: { id: "asc" },
              include: { options: true },
            },
          },
        },
        answers: {
          include: {
            question: { select: { id: true, question_text: true, correctIndex: true } },
            option: { select: { id: true, option_text: true, optionIndex: true } },
          },
        },
      },
    });

    return subs.map((s) => {
      const qIndexById = new Map<number, number>();
      s.poll.questions.forEach((q, idx) => qIndexById.set(q.id, idx));

      const optionsByQid = new Map<number, { label: string; text: string }[]>();
      for (const q of s.poll.questions) {
        const opts = [...q.options]
          .sort((a, b) => a.optionIndex - b.optionIndex)
          .map((o) => ({ label: LABELS[o.optionIndex] ?? "A", text: o.option_text }));
        optionsByQid.set(q.id, opts);
      }

      const raw = s.answers.map((a) => {
        const idx = qIndexById.get(a.question_id) ?? 0;
        return {
          qIndex: idx,
          questionId: a.question_id,
          question: a.question?.question_text ?? "",
          chosenIndex: typeof a.option?.optionIndex === "number" ? a.option!.optionIndex : -1,
          correctIndex:
            typeof a.question?.correctIndex === "number"
              ? (a.question!.correctIndex as number)
              : -1,
          correct: a.is_correct === true,
        };
      });

      const feedback = raw
        .sort((x, y) => x.qIndex - y.qIndex)
        .map((row) => ({
          qIndex: row.qIndex,
          question: row.question,
          options: optionsByQid.get(row.questionId) ?? [],
          chosenIndex: row.chosenIndex,
          correctIndex: row.correctIndex,
          correct: row.correct,
        }));

      return {
        pollId: String(s.poll.id),
        title: s.poll.title,
        pollTitle: s.poll.title,
        joinCode: s.poll.joinCode,
        submittedAt: s.submitted_at,
        score: s.score,
        total: s.total,
        feedback,
      };
    });
  }

  /**
   * Delete a student submission; (optional) also clear their live votes.
   */
  async deleteStudentSubmission(studentNumber: string, pollId: number) {
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

      // If you also want the student's live chart traces gone, uncomment:
      // await tx.vote.deleteMany({
      //   where: { user_id: user.id, question: { poll_id: pollId } },
      // });
    });

    return { success: true, message: "Deleted" };
  }

  /**
   * LIVE poll stats for lecturer dashboard.
   * - attendees from LobbyEntry
   * - per-question correctness from live Votes vs. correctIndex
   */
  async getPollStats(pollId: number) {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        questions: { include: { options: true } },
        lobby: { include: { user: { select: { studentNumber: true } } } },
      },
    });
    if (!poll) throw new Error("Poll not found");

    const attendees = poll.lobby
      .map((e) => e.user.studentNumber)
      .filter((s): s is string => !!s);

    // Pull all live votes for these questions (with option’s optionIndex)
    const qIds = poll.questions.map((q) => q.id);
    const votes = await prisma.vote.findMany({
      where: { question_id: { in: qIds } },
      include: { option: { select: { optionIndex: true } } },
    });

    const perQuestion = poll.questions.map((q) => {
      const v = votes.filter((x) => x.question_id === q.id);
      const totalAnswers = v.length;

      const correctAnswers =
        q.correctIndex == null
          ? 0
          : v.filter((x) => x.option?.optionIndex === q.correctIndex).length;

      // "Not answered" = attendees who have not voted on this question
      const notAnswered = Math.max(0, attendees.length - totalAnswers);
      const incorrect = Math.max(0, totalAnswers - correctAnswers);

      return {
        questionText: q.question_text,
        totalAnswers,
        correctAnswers,
        incorrect,
        notAnswered,
      };
    });

    return { attendees, questions: perQuestion };
  }

  async exportPollData(pollId: number, format: "json" | "csv" = "json") {
    const data = await this.getPollStats(pollId);
    if (format === "csv") {
      return data; // placeholder
    }
    return data;
  }
}

export const analyticsService = new AnalyticsService();
