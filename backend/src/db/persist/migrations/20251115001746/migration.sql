/*
  Warnings:

  - Added the required column `aiId` to the `chat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "chat" ADD COLUMN     "aiId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "chat" ADD CONSTRAINT "chat_aiId_fkey" FOREIGN KEY ("aiId") REFERENCES "ai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
