/*
  Warnings:

  - You are about to drop the column `created_at` on the `LobbyEntry` table. All the data in the column will be lost.
  - You are about to drop the column `studentNumber` on the `LobbyEntry` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[poll_id,user_id]` on the table `LobbyEntry` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `LobbyEntry` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "LobbyEntry" DROP CONSTRAINT "LobbyEntry_poll_id_fkey";

-- DropIndex
DROP INDEX "LobbyEntry_poll_id_studentNumber_key";

-- AlterTable
ALTER TABLE "LobbyEntry" DROP COLUMN "created_at",
DROP COLUMN "studentNumber",
ADD COLUMN     "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "LobbyEntry_poll_id_user_id_key" ON "LobbyEntry"("poll_id", "user_id");

-- AddForeignKey
ALTER TABLE "LobbyEntry" ADD CONSTRAINT "LobbyEntry_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "Poll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LobbyEntry" ADD CONSTRAINT "LobbyEntry_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
