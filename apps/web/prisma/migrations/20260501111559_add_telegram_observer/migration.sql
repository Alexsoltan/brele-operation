-- CreateEnum
CREATE TYPE "ProjectChatParticipantRole" AS ENUM ('client', 'team', 'unknown', 'ignore');

-- CreateTable
CREATE TABLE "ProjectChatParticipant" (
    "id" TEXT NOT NULL,
    "projectChatId" TEXT NOT NULL,
    "telegramUserId" TEXT NOT NULL,
    "username" TEXT,
    "name" TEXT,
    "role" "ProjectChatParticipantRole" NOT NULL DEFAULT 'unknown',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectChatParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectChatParticipant_projectChatId_idx" ON "ProjectChatParticipant"("projectChatId");

-- CreateIndex
CREATE INDEX "ProjectChatParticipant_role_idx" ON "ProjectChatParticipant"("role");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectChatParticipant_projectChatId_telegramUserId_key" ON "ProjectChatParticipant"("projectChatId", "telegramUserId");

-- AddForeignKey
ALTER TABLE "ProjectChatParticipant" ADD CONSTRAINT "ProjectChatParticipant_projectChatId_fkey" FOREIGN KEY ("projectChatId") REFERENCES "ProjectChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
