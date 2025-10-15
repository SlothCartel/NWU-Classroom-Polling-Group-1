"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.participationService = exports.ParticipationService = void 0;
const database_1 = require("../config/database");
const constants_1 = require("../utils/constants");
class ParticipationService {
    // -------- JOIN (create/refresh LobbyEntry) --------
    async joinPoll(data) {
        const poll = await database_1.prisma.poll.findUnique({
            where: { joinCode: data.joinCode },
            include: { questions: { include: { options: true } } },
        });
        if (!poll)
            throw new Error("Poll not found");
        if (poll.status !== constants_1.POLL_STATUS.OPEN && poll.status !== constants_1.POLL_STATUS.LIVE) {
            throw new Error("Poll is not open for joining");
        }
        if (poll.securityCode && poll.securityCode !== data.securityCode) {
            throw new Error("Invalid security code");
        }
        const user = await database_1.prisma.user.findUnique({
            where: { studentNumber: data.studentNumber },
            select: { id: true },
        });
        if (!user)
            throw new Error("Student not found");
        // ✅ Ensure student appears in the lobby immediately (idempotent)
        await database_1.prisma.lobbyEntry.upsert({
            where: { poll_id_user_id: { poll_id: poll.id, user_id: user.id } },
            create: { poll_id: poll.id, user_id: user.id },
            update: {}, // keep original joined_at
        });
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
    // -------- LIVE CHOICE (upsert Vote per (question,user)) --------
    async recordLiveChoice(params) {
        const { pollId, userId, questionId, optionIndex } = params;
        // Verify question belongs to poll
        const question = await database_1.prisma.question.findUnique({
            where: { id: questionId },
            include: { options: true, poll: { select: { id: true, status: true } } },
        });
        if (!question || question.poll.id !== pollId) {
            throw new Error("Invalid question for this poll");
        }
        if (question.poll.status !== constants_1.POLL_STATUS.LIVE) {
            // silently ignore if poll isn’t live (or throw; your call)
            return { success: true };
        }
        // If -1 treat as “no vote” → delete any existing vote
        if (optionIndex < 0) {
            await database_1.prisma.vote.deleteMany({
                where: { question_id: questionId, user_id: userId },
            });
            return { success: true };
        }
        // Map optionIndex -> option_id
        const opt = question.options.find((o) => o.optionIndex === optionIndex);
        if (!opt)
            throw new Error("Invalid option index");
        // Upsert a single vote per question/user
        await database_1.prisma.vote.upsert({
            where: { question_id_user_id: { question_id: questionId, user_id: userId } },
            create: { question_id: questionId, user_id: userId, option_id: opt.id },
            update: { option_id: opt.id },
        });
        return { success: true };
    }
    // -------- FINAL SUBMIT (persist submission+answers) --------
    async submitAnswers(data) {
        const poll = await database_1.prisma.poll.findUnique({
            where: { id: data.pollId },
            include: {
                questions: {
                    orderBy: { id: "asc" },
                    include: { options: true },
                },
            },
        });
        if (!poll)
            throw new Error("Poll not found");
        if (poll.status !== constants_1.POLL_STATUS.LIVE && poll.status !== constants_1.POLL_STATUS.CLOSED) {
            throw new Error("Poll is not accepting submissions");
        }
        const total = poll.questions.length;
        let score = 0;
        const answerRows = [];
        for (let i = 0; i < total; i++) {
            const q = poll.questions[i];
            const submitted = data.answers[i];
            const optionIdx = submitted != null && Number.isFinite(Number(submitted.optionIndex))
                ? parseInt(String(submitted.optionIndex), 10)
                : -1;
            if (optionIdx < 0) {
                answerRows.push({ question_id: q.id, option_id: null, is_correct: null });
                continue;
            }
            const opt = q.options.find((o) => o.optionIndex === optionIdx) || null;
            const isCorrect = q.correctIndex == null || opt == null ? null : q.correctIndex === optionIdx;
            if (isCorrect === true)
                score += 1;
            answerRows.push({
                question_id: q.id,
                option_id: opt ? opt.id : null,
                is_correct: isCorrect,
            });
        }
        const submission = await database_1.prisma.$transaction(async (tx) => {
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
    // -------- LOBBY (read LobbyEntry; DO NOT clear on submit) --------
    async getLobbyStudents(pollId) {
        const entries = await database_1.prisma.lobbyEntry.findMany({
            where: { poll_id: pollId },
            orderBy: { joined_at: "asc" },
            include: { user: { select: { id: true, name: true, studentNumber: true } } },
        });
        return entries.map((e) => ({
            id: e.user.id,
            name: e.user.name,
            studentNumber: e.user.studentNumber ?? "",
            joinedAt: e.joined_at,
        }));
    }
    async kickStudentFromLobby(pollId, studentNumber) {
        const user = await database_1.prisma.user.findUnique({
            where: { studentNumber },
            select: { id: true },
        });
        if (!user)
            throw new Error("Student not found");
        await database_1.prisma.lobbyEntry.deleteMany({
            where: { poll_id: pollId, user_id: user.id },
        });
        // NOTE: We do NOT touch votes or submissions here.
        return { success: true, message: "Student removed from lobby" };
    }
}
exports.ParticipationService = ParticipationService;
exports.participationService = new ParticipationService();
//# sourceMappingURL=participationService.js.map