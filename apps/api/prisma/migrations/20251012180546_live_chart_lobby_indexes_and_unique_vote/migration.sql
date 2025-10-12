/*
  Warnings:

  - A unique constraint covering the columns `[question_id,user_id]` on the table `Vote` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "Answer_submission_id_idx" ON "Answer"("submission_id");

-- CreateIndex
CREATE INDEX "Answer_question_id_idx" ON "Answer"("question_id");

-- CreateIndex
CREATE INDEX "Answer_option_id_idx" ON "Answer"("option_id");

-- CreateIndex
CREATE INDEX "Submission_poll_id_idx" ON "Submission"("poll_id");

-- CreateIndex
CREATE INDEX "Submission_user_id_idx" ON "Submission"("user_id");

-- CreateIndex
CREATE INDEX "Vote_question_id_idx" ON "Vote"("question_id");

-- CreateIndex
CREATE INDEX "Vote_option_id_idx" ON "Vote"("option_id");

-- CreateIndex
CREATE INDEX "Vote_user_id_idx" ON "Vote"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_question_id_user_id_key" ON "Vote"("question_id", "user_id");
