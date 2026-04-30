-- CreateTable
CREATE TABLE "ProjectScoringConfig" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectScoringConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectScoringConfig_workspaceId_idx" ON "ProjectScoringConfig"("workspaceId");

-- CreateIndex
CREATE INDEX "ProjectScoringConfig_group_idx" ON "ProjectScoringConfig"("group");

-- CreateIndex
CREATE INDEX "ProjectScoringConfig_sortOrder_idx" ON "ProjectScoringConfig"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectScoringConfig_workspaceId_key_key" ON "ProjectScoringConfig"("workspaceId", "key");

-- CreateIndex
CREATE INDEX "Project_healthScore_idx" ON "Project"("healthScore");

-- CreateIndex
CREATE INDEX "Project_healthLabel_idx" ON "Project"("healthLabel");

-- AddForeignKey
ALTER TABLE "ProjectScoringConfig" ADD CONSTRAINT "ProjectScoringConfig_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
