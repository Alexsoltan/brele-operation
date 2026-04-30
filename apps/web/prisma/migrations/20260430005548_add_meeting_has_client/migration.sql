-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "hasClient" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "MeetingType" ADD COLUMN     "hasClient" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Meeting_hasClient_idx" ON "Meeting"("hasClient");
