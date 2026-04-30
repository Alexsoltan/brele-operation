-- CreateTable
CREATE TABLE "ProjectHealthPoint" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "score" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL,
    "impact" INTEGER NOT NULL,
    "risk" "Risk" NOT NULL,
    "clientMood" "Mood" NOT NULL,
    "teamMood" "Mood" NOT NULL,
    "hasClient" BOOLEAN NOT NULL DEFAULT true,
    "meetingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectHealthPoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectHealthPoint_projectId_idx" ON "ProjectHealthPoint"("projectId");

-- CreateIndex
CREATE INDEX "ProjectHealthPoint_date_idx" ON "ProjectHealthPoint"("date");

-- CreateIndex
CREATE INDEX "ProjectHealthPoint_score_idx" ON "ProjectHealthPoint"("score");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectHealthPoint_projectId_date_meetingId_key" ON "ProjectHealthPoint"("projectId", "date", "meetingId");

-- AddForeignKey
ALTER TABLE "ProjectHealthPoint" ADD CONSTRAINT "ProjectHealthPoint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
