-- DropForeignKey
ALTER TABLE "LobbyEntry" DROP CONSTRAINT "LobbyEntry_poll_id_fkey";

-- AddForeignKey
ALTER TABLE "LobbyEntry" ADD CONSTRAINT "LobbyEntry_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;
