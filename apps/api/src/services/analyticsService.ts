import { prisma } from "../config/database";

const LABELS = ["A", "B", "C", "D"] as const;

export class AnalyticsService {
  // --- Student history (unchanged) ---
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

  // --- Delete submission (unchanged logic) ---
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
      // If you also want to wipe live votes for this student, uncomment:
      // await tx.vote.deleteMany({ where: { user_id: user.id, question: { poll_id: pollId } } });
    });

    return { success: true, message: "Deleted" };
  }

  // --- Live stats used by the stats page (unchanged) ---
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

  // --- CSV exporter: matches requested layout incl. Not answered + Attendance ---
  async exportPollCsv(pollId: number): Promise<string> {
    // ✅ Use `select` for scalars and `include` only for relations
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      select: {
        title: true,
        questions: {
          orderBy: { id: "asc" },
          select: { id: true, question_text: true, correctIndex: true },
        },
        lobby: {
          include: { user: { select: { id: true, studentNumber: true } } },
        },
      },
    });
    if (!poll) throw new Error("Poll not found");

    const attendees = poll.lobby.map((e) => e.user); // {id, studentNumber}
    const qIds = poll.questions.map((q) => q.id);

    const votes = await prisma.vote.findMany({
      where: { question_id: { in: qIds } },
      include: {
        option: { select: { optionIndex: true } },
        user: { select: { id: true } },
      },
    });

    // (userId, questionId) -> chosen optionIndex
    const voteByUserQ = new Map<string, number>();
    for (const v of votes) {
      const key = `${v.user.id}-${v.question_id}`;
      if (!voteByUserQ.has(key)) voteByUserQ.set(key, v.option?.optionIndex ?? -1);
    }

    const perQ = poll.questions.map((q) => {
      let correct = 0;
      let incorrect = 0;
      let notAnswered = 0;

      for (const u of attendees) {
        const key = `${u.id}-${q.id}`;
        if (!voteByUserQ.has(key)) {
          notAnswered++;
        } else {
          const chosen = voteByUserQ.get(key)!;
          if (q.correctIndex != null && chosen === q.correctIndex) correct++;
          else incorrect++;
        }
      }
      return { correct, incorrect, notAnswered };
    });

    const totalCorrect = perQ.reduce((s, r) => s + r.correct, 0);
    const totalIncorrect = perQ.reduce((s, r) => s + r.incorrect, 0);
    const totalNotAns = perQ.reduce((s, r) => s + r.notAnswered, 0);
    const denomAll = Math.max(1, attendees.length * poll.questions.length);

    const pct = (num: number, den: number) => `${den > 0 ? Math.round((num / den) * 100) : 0}%`;
    const esc = (val: unknown) => {
      const s = String(val ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const out: string[] = [];

    // Title row
    out.push(`${poll.title} stats`);
    out.push("");

    // Summary header
    out.push([ "", "Correct", "Incorrect", "Not answered" ].join(","));

    // q1..qN rows (percentages; denominator = attendees.length)
    const denPerQ = Math.max(1, attendees.length);
    poll.questions.forEach((q, i) => {
      const r = perQ[i];
      out.push([ `q${i + 1}`, pct(r.correct, denPerQ), pct(r.incorrect, denPerQ), pct(r.notAnswered, denPerQ) ].join(","));
    });

    // Totals row (percentages across all questions * attendees)
    out.push([ "total", pct(totalCorrect, denomAll), pct(totalIncorrect, denomAll), pct(totalNotAns, denomAll) ].join(","));

    out.push("");
    out.push("Attendance");

    // Attendance header
    const qHeaders = poll.questions.map((_, i) => `q${i + 1}`);
    out.push([ "", ...qHeaders, "total" ].join(","));

    // Attendance body
    for (const u of attendees) {
      const cells: string[] = [];
      let correctCount = 0;

      poll.questions.forEach((q) => {
        const key = `${u.id}-${q.id}`;
        if (!voteByUserQ.has(key)) {
          cells.push("N/A");
        } else {
          const chosen = voteByUserQ.get(key)!;
          if (q.correctIndex != null && chosen === q.correctIndex) {
            correctCount++;
            cells.push("100%");
          } else {
            cells.push("0%");
          }
        }
      });

      const totalPct = pct(correctCount, poll.questions.length);
      out.push([ esc(u.studentNumber ?? ""), ...cells, totalPct ].join(","));
    }

    // Prepend UTF-8 BOM for Excel
    return "\uFEFF" + out.join("\r\n");
  }
}

export const analyticsService = new AnalyticsService();
