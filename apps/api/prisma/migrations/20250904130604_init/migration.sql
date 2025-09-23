-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Poll" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "Poll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Question" (
    "id" SERIAL NOT NULL,
    "poll_id" INTEGER NOT NULL,
    "question_text" TEXT NOT NULL,
    "question_type" TEXT NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Option" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "option_text" TEXT NOT NULL,

    CONSTRAINT "Option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Vote" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "option_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "vote_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Analytics" (
    "id" SERIAL NOT NULL,
    "poll_id" INTEGER NOT NULL,
    "total_responses" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- AddForeignKey
ALTER TABLE "public"."Poll" ADD CONSTRAINT "Poll_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "public"."Poll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Option" ADD CONSTRAINT "Option_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vote" ADD CONSTRAINT "Vote_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vote" ADD CONSTRAINT "Vote_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "public"."Option"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vote" ADD CONSTRAINT "Vote_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Analytics" ADD CONSTRAINT "Analytics_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "public"."Poll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;