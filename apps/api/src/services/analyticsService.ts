import { prisma } from "../config/database";

const LABELS = ["A", "B", "C", "D"] as const;

export class AnalyticsService {
  /**
   * Student history – returns UI-ready structure expected by the web app.
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
      // Map questionId -> index in poll.questions order
      const qIndexById = new Map<number, number>();
      s.poll.questions.forEach((q, idx) => qIndexById.set(q.id, idx));

      // Prepare options (A–D) for each question
      const optionsByQid = new Map<
        number,
        { label: string; text: string }[]
      >();
      for (const q of s.poll.questions) {
        const opts = [...q.options]
          .sort((a, b) => a.optionIndex - b.optionIndex)
          .map((o) => ({ label: LABELS[o.optionIndex] ?? "A", text: o.option_text }));
        optionsByQid.set(q.id, opts);
      }

      // Build ordered feedback
      const raw = s.answers.map((a) => {
        const idx = qIndexById.get(a.question_id) ?? 0;
        return {
          qIndex: idx,
          questionId: a.question_id,
          question: a.question?.question_text ?? "",
          chosenIndex:
            typeof a.option?.optionIndex === "number" ? a.option!.optionIndex : -1,
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
        pollTitle: s.poll.title, // keep both keys for UI tolerance
        joinCode: s.poll.joinCode,
        submittedAt: s.submitted_at,
        score: s.score,
        total: s.total,
        feedback,
      };
    });
  }

  /**
   * Delete a student submission (and its answers) with FK safety.
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
      if (!sub) return;

      await tx.answer.deleteMany({ where: { submission_id: sub.id } });
      await tx.submission.delete({ where: { id: sub.id } });
    });

    return { success: true, message: "Deleted" };
  }

  /**
   * Minimal poll stats for lecturer dashboard (extend as needed).
   */
  async getPollStats(pollId: number) {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        submissions: { include: { answers: true } },
        questions: { include: { options: true } },
      },
    });
    if (!poll) throw new Error("Poll not found");

    const attendees = poll.submissions.length;

    // Very basic per-question stats derived from answers
    const questionIndexById = new Map<number, number>();
    poll.questions.forEach((q, i) => questionIndexById.set(q.id, i));

    const perQuestion = poll.questions.map((q) => ({
      questionText: q.question_text,
      totalAnswers: 0,
      correctAnswers: 0,
    }));

    for (const sub of poll.submissions) {
      for (const ans of sub.answers) {
        const qi = questionIndexById.get(ans.question_id);
        if (qi == null) continue;
        perQuestion[qi].totalAnswers += 1;
        if (ans.is_correct) perQuestion[qi].correctAnswers += 1;
      }
    }

    return { attendees, questions: perQuestion };
  }

  /**
   * Export poll data (JSON now; CSV placeholder hook).
   */
  async exportPollData(pollId: number, format: "json" | "csv" = "json") {
    const data = await this.getPollStats(pollId);
    if (format === "csv") {
      // Optionally convert `data` to CSV here if you want to implement it later.
      return data; // placeholder
    }
    return data;
  }
}

export const analyticsService = new AnalyticsService();
