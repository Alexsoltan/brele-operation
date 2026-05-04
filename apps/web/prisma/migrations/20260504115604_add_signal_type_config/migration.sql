-- CreateTable
CREATE TABLE "SignalTypeConfig" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isHighRisk" BOOLEAN NOT NULL DEFAULT false,
    "direction" "SignalDirection" NOT NULL DEFAULT 'neutral',
    "healthImpact" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "clientMoodImpact" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "teamMoodImpact" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignalTypeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SignalTypeConfig_workspaceId_idx" ON "SignalTypeConfig"("workspaceId");

-- CreateIndex
CREATE INDEX "SignalTypeConfig_key_idx" ON "SignalTypeConfig"("key");

-- CreateIndex
CREATE INDEX "SignalTypeConfig_direction_idx" ON "SignalTypeConfig"("direction");

-- CreateIndex
CREATE INDEX "SignalTypeConfig_isHighRisk_idx" ON "SignalTypeConfig"("isHighRisk");

-- CreateIndex
CREATE INDEX "SignalTypeConfig_isActive_idx" ON "SignalTypeConfig"("isActive");

-- CreateIndex
CREATE INDEX "SignalTypeConfig_sortOrder_idx" ON "SignalTypeConfig"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SignalTypeConfig_workspaceId_key_key" ON "SignalTypeConfig"("workspaceId", "key");

-- AddForeignKey
ALTER TABLE "SignalTypeConfig" ADD CONSTRAINT "SignalTypeConfig_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
