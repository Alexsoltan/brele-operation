-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "meetingTypeId" TEXT;

-- CreateTable
CREATE TABLE "MeetingType" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "prompt" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MeetingType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MeetingType_workspaceId_idx" ON "MeetingType"("workspaceId");

-- CreateIndex
CREATE INDEX "MeetingType_deletedAt_idx" ON "MeetingType"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingType_workspaceId_slug_key" ON "MeetingType"("workspaceId", "slug");

-- CreateIndex
CREATE INDEX "Meeting_meetingTypeId_idx" ON "Meeting"("meetingTypeId");

-- AddForeignKey
ALTER TABLE "MeetingType" ADD CONSTRAINT "MeetingType_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_meetingTypeId_fkey" FOREIGN KEY ("meetingTypeId") REFERENCES "MeetingType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
