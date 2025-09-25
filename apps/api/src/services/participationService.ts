import { prisma } from "../config/database";
import { gradeSubmission } from "../utils/grading";
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
    questionId: number;
    optionIndex: number;
  }>;
}

export class ParticipationService {
  async joinPoll(data: JoinPollData) {
    // Find poll by join code
    const poll = await prisma.poll.findUnique({
      where: { joinCode: data.joinCode },
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

    // Check if poll is open for joining
    if (poll.status !== POLL_STATUS.OPEN && poll.status !== POLL_STATUS.LIVE) {
      throw new Error("Poll is not open for joining");
    }

    // Check security code if required
    if (poll.securityCode && poll.securityCode !== data.securityCode) {
      throw new Error("Invalid security code");
    }

    // Find student user
    const user = await prisma.user.findUnique({
      where: { studentNumber: data.studentNumber },
    });

    if (!user) {
      throw new Error("Student not found");
    }

    // Check if student already submitted
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        poll_id_user_id: {
          poll_id: poll.id,
          user_id: user.id,
        },
      },
    });

    if (existingSubmission) {
      throw new Error("You have already participated in this poll");
    }

    // Format poll for student (without correct answers)
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
          .map((opt) => ({
            text: opt.option_text,
            index: opt.optionIndex,
          })),
      })),
    };
  }

  async submitAnswers(data: SubmitAnswersData) {
    // Get poll with questions for grading
    const poll = await prisma.poll.findUnique({
      where: { id: data.pollId },
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

    // Check if poll is live or closed (can submit)
    if (poll.status !== POLL_STATUS.LIVE && poll.status !== POLL_STATUS.CLOSED) {
      throw new Error("Poll is not accepting submissions");
    }

    // Check if user already submitted
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        poll_id_user_id: {
          poll_id: data.pollId,
          user_id: data.userId,
        },
      },
    });

    if (existingSubmission) {
      throw new Error("You have already submitted answers for this poll");
    }

    // Format questions for grading
    const questions = poll.questions.map((q) => ({
      text: q.question_text,
      correctIndex: q.correctIndex || 0,
      options: q.options
        .sort((a, b) => a.optionIndex - b.optionIndex)
        .map((opt) => ({
          text: opt.option_text,
          index: opt.optionIndex,
        })),
    }));

    // Grade submission
    const gradeResult = gradeSubmission(questions, data.answers);

    // Create submission record
    await prisma.submission.create({
      data: {
        poll_id: data.pollId,
        user_id: data.userId,
        score: gradeResult.score,
        total: gradeResult.total,
        answers: {
          create: data.answers.map((answer, _index) => {
            const question = poll.questions.find((q) => q.id === answer.questionId);
            const option = question?.options.find((opt) => opt.optionIndex === answer.optionIndex);
            const isCorrect = answer.optionIndex === question?.correctIndex;

            return {
              question_id: answer.questionId,
              option_id: option?.id,
              answer_text: option?.option_text,
              is_correct: isCorrect,
            };
          }),
        },
      },
    });

    return gradeResult;
  }

  async getLobbyStudents(pollId: number) {
    // Get all users who have joined but not yet submitted
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        submissions: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!poll) {
      throw new Error("Poll not found");
    }

    // For now, return submitted users as "in lobby"
    // In a real implementation, you'd track lobby separately
    return poll.submissions.map((sub) => ({
      id: sub.user.id,
      name: sub.user.name,
      studentNumber: sub.user.studentNumber,
      joinedAt: sub.submitted_at,
    }));
  }

  async kickStudentFromLobby(pollId: number, studentNumber: string) {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { studentNumber },
    });

    if (!user) {
      throw new Error("Student not found");
    }

    // Remove their submission if exists
    await prisma.submission.deleteMany({
      where: {
        poll_id: pollId,
        user_id: user.id,
      },
    });

    return { success: true, message: "Student removed from poll" };
  }
}

// Export both the class and an instance
export const participationService = new ParticipationService();
