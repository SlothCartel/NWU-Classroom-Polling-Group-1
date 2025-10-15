"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = exports.AnalyticsService = void 0;
const database_1 = require("../config/database");
const LABELS = ["A", "B", "C", "D"];
class AnalyticsService {
    // --- Student history (unchanged) ---
    async getStudentSubmissionHistory(studentNumber) {
        const user = await database_1.prisma.user.findUnique({
            where: { studentNumber },
            select: { id: true },
        });
        if (!user)
            return [];
        const subs = await database_1.prisma.submission.findMany({
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
            const qIndexById = new Map();
            s.poll.questions.forEach((q, idx) => qIndexById.set(q.id, idx));
            const optionsByQid = new Map();
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
                    chosenIndex: typeof a.option?.optionIndex === "number" ? a.option.optionIndex : -1,
                    correctIndex: typeof a.question?.correctIndex === "number"
                        ? a.question.correctIndex
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
    async deleteStudentSubmission(studentNumber, pollId) {
        const user = await database_1.prisma.user.findUnique({
            where: { studentNumber },
            select: { id: true },
        });
        if (!user)
            throw new Error("Student not found");
        await database_1.prisma.$transaction(async (tx) => {
            const sub = await tx.submission.findUnique({
                where: { poll_id_user_id: { poll_id: pollId, user_id: user.id } },
                select: { id: true },
            });
            if (sub) {
                await tx.answer.deleteMany({ where: { submission_id: sub.id } });
                await tx.submission.delete({ where: { id: sub.id } });
            }
            // To also wipe live votes for this student, you could add:
            // await tx.vote.deleteMany({ where: { user_id: user.id, question: { poll_id: pollId } } });
        });
        return { success: true, message: "Deleted" };
    }
    // --- Live stats used by the stats page (unchanged) ---
    async getPollStats(pollId) {
        const poll = await database_1.prisma.poll.findUnique({
            where: { id: pollId },
            include: {
                questions: { include: { options: true } },
                lobby: { include: { user: { select: { studentNumber: true } } } },
            },
        });
        if (!poll)
            throw new Error("Poll not found");
        const attendees = poll.lobby
            .map((e) => e.user.studentNumber)
            .filter((s) => !!s);
        const qIds = poll.questions.map((q) => q.id);
        const votes = await database_1.prisma.vote.findMany({
            where: { question_id: { in: qIds } },
            include: { option: { select: { optionIndex: true } } },
        });
        const perQuestion = poll.questions.map((q) => {
            const v = votes.filter((x) => x.question_id === q.id);
            const totalAnswers = v.length;
            const correctAnswers = q.correctIndex == null
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
    // --- CSV exporter: matches requested layout incl. Attendance & Not answered ---
    async exportPollCsv(pollId) {
        // Pull what we need
        const poll = await database_1.prisma.poll.findUnique({
            where: { id: pollId },
            include: {
                questions: {
                    orderBy: { id: "asc" },
                    select: { id: true, question_text: true, correctIndex: true },
                },
                lobby: { include: { user: { select: { studentNumber: true } } } },
            },
        });
        if (!poll)
            throw new Error("Poll not found");
        const attendees = poll.lobby
            .map((e) => e.user.studentNumber)
            .filter((s) => !!s);
        const qIds = poll.questions.map((q) => q.id);
        const votes = await database_1.prisma.vote.findMany({
            where: { question_id: { in: qIds } },
            include: { option: { select: { optionIndex: true } } },
        });
        const perQ = poll.questions.map((q) => {
            const v = votes.filter((x) => x.question_id === q.id);
            const totalAnswers = v.length;
            const correctAnswers = q.correctIndex == null ? 0 : v.filter((x) => x.option?.optionIndex === q.correctIndex).length;
            const notAnswered = Math.max(0, attendees.length - totalAnswers);
            const incorrect = Math.max(0, totalAnswers - correctAnswers);
            return {
                questionText: q.question_text,
                correct: correctAnswers,
                incorrect,
                notAnswered,
                total: totalAnswers,
            };
        });
        const pct = (num, den) => den > 0 ? `${Math.round((num / den) * 100)}%` : "0%";
        const esc = (val) => {
            const s = String(val ?? "");
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const rows = [];
        // Title row
        rows.push(`${esc(poll.title)} exporting stats`);
        // Attendance block (blank line, label, number in column B)
        rows.push("");
        rows.push("Attendance");
        rows.push(`,${attendees.length}`);
        rows.push("");
        // Question table header (percentages)
        rows.push(["", "Correct", "Incorrect", "Not answered"].map(esc).join(","));
        perQ.forEach((q, i) => {
            rows.push([
                `q${i + 1}`,
                pct(q.correct, attendees.length),
                pct(q.incorrect, attendees.length),
                pct(q.notAnswered, attendees.length),
            ]
                .map(esc)
                .join(","));
        });
        // Totals row (percentages across attendees * number of questions)
        const totals = perQ.reduce((acc, r) => {
            acc.correct += r.correct;
            acc.incorrect += r.incorrect;
            acc.notAnswered += r.notAnswered;
            return acc;
        }, { correct: 0, incorrect: 0, notAnswered: 0 });
        const denom = attendees.length * Math.max(1, perQ.length);
        rows.push(["total", pct(totals.correct, denom), pct(totals.incorrect, denom), pct(totals.notAnswered, denom)]
            .map(esc)
            .join(","));
        // Blank and detailed attendance table (per-student correctness %)
        rows.push("");
        rows.push("Attendance");
        rows.push(["", ...perQ.map((_, i) => `q${i + 1}`), "total"].map(esc).join(","));
        // Map of questionId -> correctIndex
        const correctIndexByQ = new Map(poll.questions.map((q) => [q.id, q.correctIndex ?? null]));
        for (const student of attendees) {
            // find this user id (may not exist; if not, show N/A per question)
            const user = await database_1.prisma.user.findUnique({
                where: { studentNumber: student },
                select: { id: true },
            });
            let perQStudentPct = [];
            let totalCorrect = 0;
            if (user) {
                const svotes = await database_1.prisma.vote.findMany({
                    where: { user_id: user.id, question_id: { in: qIds } },
                    include: { option: { select: { optionIndex: true } } },
                });
                const byQ = new Map(); // qId -> chosen optionIndex
                for (const v of svotes) {
                    if (typeof v.option?.optionIndex === "number") {
                        byQ.set(v.question_id, v.option.optionIndex);
                    }
                }
                perQStudentPct = poll.questions.map((q) => {
                    const chosen = byQ.get(q.id);
                    const correctIdx = correctIndexByQ.get(q.id);
                    if (chosen == null)
                        return "N/A"; // not answered by this student
                    const ok = correctIdx != null && chosen === correctIdx;
                    if (ok)
                        totalCorrect += 1;
                    return ok ? "100%" : "0%";
                });
            }
            else {
                perQStudentPct = poll.questions.map(() => "N/A");
            }
            const totalPct = perQ.length > 0 ? `${Math.round((totalCorrect / perQ.length) * 100)}%` : "0%";
            rows.push([student, ...perQStudentPct, totalPct].map(esc).join(","));
        }
        // ---- Finalize file with Excel-friendly settings ----
        // 1) Excel separator hint so comma is used as the delimiter (avoids 0,1 issue)
        // 2) UTF-8 BOM for proper Unicode handling
        const content = ["sep=,", ...rows].join("\n");
        return "\uFEFF" + content;
    }
}
exports.AnalyticsService = AnalyticsService;
exports.analyticsService = new AnalyticsService();
//# sourceMappingURL=analyticsService.js.map