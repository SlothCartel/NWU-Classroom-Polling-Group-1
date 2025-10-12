-- CreateTable
CREATE TABLE "LobbyEntry" (
    "id" SERIAL NOT NULL,
    "poll_id" INTEGER NOT NULL,
    "studentNumber" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LobbyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LobbyEntry_poll_id_idx" ON "LobbyEntry"("poll_id");

-- CreateIndex
CREATE UNIQUE INDEX "LobbyEntry_poll_id_studentNumber_key" ON "LobbyEntry"("poll_id", "studentNumber");

-- AddForeignKey
ALTER TABLE "LobbyEntry" ADD CONSTRAINT "LobbyEntry_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;
