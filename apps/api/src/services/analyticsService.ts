import { prisma } from "../config/database";

export class AnalyticsService {
  async getPollStats(pollId: number) {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        questions: {
          include: {
            options: {
              include: {
                answers: true,
              },
            },
          },
        },
        submissions: true,
      },
    });

    if (!poll) {
      throw new Error("Poll not found");
    }

    const totalSubmissions = poll.submissions.length;

    // Calculate stats per question
    const questionStats = poll.questions.map((question: any) => {
      const optionStats = question.options.map((option: any) => ({
        text: option.option_text,
        index: option.optionIndex,
        count: option.answers.length,
        percentage: totalSubmissions > 0 ? (option.answers.length / totalSubmissions) * 100 : 0,
        isCorrect: option.optionIndex === question.correctIndex,
      }));

      const correctAnswers = question.options
        .filter((opt: any) => opt.optionIndex === question.correctIndex)
        .reduce((sum: number, opt: any) => sum + opt.answers.length, 0);

      return {
        questionId: question.id,
        questionText: question.question_text,
        totalAnswers: optionStats.reduce((sum, opt) => sum + opt.count, 0),
        correctAnswers,
        correctPercentage: totalSubmissions > 0 ? (correctAnswers / totalSubmissions) * 100 : 0,
        options: optionStats.sort((a, b) => a.index - b.index),
      };
    });

    // Calculate overall stats
    const totalPossiblePoints = poll.questions.length * totalSubmissions;
    const totalCorrectAnswers = questionStats.reduce((sum, q) => sum + q.correctAnswers, 0);
    const averageScore =
      totalSubmissions > 0
        ? poll.submissions.reduce((sum: number, sub: any) => sum + sub.score, 0) / totalSubmissions
        : 0;

    return {
      pollId: poll.id,
      title: poll.title,
      status: poll.status,
      totalSubmissions,
      averageScore: Math.round(averageScore * 100) / 100,
      averagePercentage:
        totalPossiblePoints > 0 ? (totalCorrectAnswers / totalPossiblePoints) * 100 : 0,
      questions: questionStats,
    };
  }

  async getStudentSubmissionHistory(studentNumber: string) {
    const user = await prisma.user.findUnique({
      where: { studentNumber },
      include: {
        Submissions: {
          // Capital S to match Prisma schema
          include: {
            poll: true,
            answers: {
              include: {
                question: true,
                option: true,
              },
            },
          },
          orderBy: { submitted_at: "desc" },
        },
      },
    });

    if (!user) {
      throw new Error("Student not found");
    }

    return user.Submissions.map((submission: any) => ({
      pollId: submission.poll.id.toString(),
      pollTitle: submission.poll.title,
      score: submission.score,
      total: submission.total,
      percentage: Math.round((submission.score / submission.total) * 100),
      submittedAt: submission.submitted_at,
      feedback: submission.answers.map((answer: any) => ({
        questionText: answer.question.question_text,
        studentChoice: answer.answer_text || "No answer",
        isCorrect: answer.is_correct,
      })),
    }));
  }

  async deleteStudentSubmission(studentNumber: string, pollId: number) {
    const user = await prisma.user.findUnique({
      where: { studentNumber },
    });

    if (!user) {
      throw new Error("Student not found");
    }

    const deleted = await prisma.submission.deleteMany({
      where: {
        poll_id: pollId,
        user_id: user.id,
      },
    });

    if (deleted.count === 0) {
      throw new Error("Submission not found");
    }

    return { success: true, message: "Submission deleted successfully" };
  }

  async exportPollData(pollId: number, format: "json" | "csv" = "json") {
    const stats = await this.getPollStats(pollId);

    if (format === "json") {
      return stats;
    }

    // For CSV, create a simplified format
    const csvData = stats.questions.map((q: any) => ({
      question: q.questionText,
      totalAnswers: q.totalAnswers,
      correctAnswers: q.correctAnswers,
      correctPercentage: q.correctPercentage,
      ...q.options.reduce((acc: any, opt: any) => {
        acc[`option_${opt.index}_count`] = opt.count;
        acc[`option_${opt.index}_percentage`] = opt.percentage;
        return acc;
      }, {}),
    }));

    return csvData;
  }
}

// Export both the class and an instance
export const analyticsService = new AnalyticsService();
