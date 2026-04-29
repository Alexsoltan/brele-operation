-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('active', 'hold', 'archived');

-- CreateEnum
CREATE TYPE "Mood" AS ENUM ('good', 'neutral', 'bad');

-- CreateEnum
CREATE TYPE "Risk" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "MeetingAnalysisStatus" AS ENUM ('pending', 'analyzed', 'manual', 'error');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "client" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'active',
    "clientMood" "Mood" NOT NULL DEFAULT 'neutral',
    "teamMood" "Mood" NOT NULL DEFAULT 'neutral',
    "risk" "Risk" NOT NULL DEFAULT 'low',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "meetingType" TEXT NOT NULL,
    "transcriptText" TEXT,
    "summary" TEXT NOT NULL,
    "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "clientMood" "Mood" NOT NULL DEFAULT 'neutral',
    "teamMood" "Mood" NOT NULL DEFAULT 'neutral',
    "risk" "Risk" NOT NULL DEFAULT 'low',
    "analysisStatus" "MeetingAnalysisStatus" NOT NULL DEFAULT 'pending',
    "modelName" TEXT,
    "analyzedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_deletedAt_idx" ON "Project"("deletedAt");

-- CreateIndex
CREATE INDEX "Meeting_projectId_idx" ON "Meeting"("projectId");

-- CreateIndex
CREATE INDEX "Meeting_date_idx" ON "Meeting"("date");

-- CreateIndex
CREATE INDEX "Meeting_deletedAt_idx" ON "Meeting"("deletedAt");

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
