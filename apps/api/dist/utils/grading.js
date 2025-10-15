"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gradeSubmission = gradeSubmission;
function gradeSubmission(questions, answers) {
    let score = 0;
    const feedback = [];
    questions.forEach((question, index) => {
        const answer = answers.find((a) => a.questionId === index);
        const isCorrect = answer?.optionIndex === question.correctIndex;
        if (isCorrect)
            score++;
        feedback.push({
            questionIndex: index,
            questionText: question.text,
            studentChoice: answer ? question.options[answer.optionIndex].text : "No answer",
            correctChoice: question.options[question.correctIndex].text,
            isCorrect,
        });
    });
    return {
        score,
        total: questions.length,
        feedback,
    };
}
//# sourceMappingURL=grading.js.map