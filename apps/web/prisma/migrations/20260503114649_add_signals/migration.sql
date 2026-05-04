-- CreateEnum
CREATE TYPE "PromptConfigKey" AS ENUM ('meeting_analysis', 'chat_daily_summary', 'signal_extraction_from_meeting', 'signal_extraction_from_chat', 'project_health_summary');

-- CreateTable
CREATE TABLE "PromptConfig" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "key" "PromptConfigKey" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "systemPrompt" TEXT NOT NULL,
    "userPrompt" TEXT NOT NULL,
    "modelName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignalWeightConfig" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "category" "SignalCategory" NOT NULL,
    "type" "SignalType" NOT NULL,
    "direction" "SignalDirection" NOT NULL,
    "severity" "SignalSeverity" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "label" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignalWeightConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromptConfig_workspaceId_idx" ON "PromptConfig"("workspaceId");

-- CreateIndex
CREATE INDEX "PromptConfig_key_idx" ON "PromptConfig"("key");

-- CreateIndex
CREATE INDEX "PromptConfig_isActive_idx" ON "PromptConfig"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PromptConfig_workspaceId_key_key" ON "PromptConfig"("workspaceId", "key");

-- CreateIndex
CREATE INDEX "SignalWeightConfig_workspaceId_idx" ON "SignalWeightConfig"("workspaceId");

-- CreateIndex
CREATE INDEX "SignalWeightConfig_category_idx" ON "SignalWeightConfig"("category");

-- CreateIndex
CREATE INDEX "SignalWeightConfig_type_idx" ON "SignalWeightConfig"("type");

-- CreateIndex
CREATE INDEX "SignalWeightConfig_severity_idx" ON "SignalWeightConfig"("severity");

-- CreateIndex
CREATE INDEX "SignalWeightConfig_isActive_idx" ON "SignalWeightConfig"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SignalWeightConfig_workspaceId_category_type_direction_seve_key" ON "SignalWeightConfig"("workspaceId", "category", "type", "direction", "severity");

-- CreateIndex
CREATE INDEX "ProjectSignal_source_idx" ON "ProjectSignal"("source");

-- CreateIndex
CREATE INDEX "ProjectSignal_status_idx" ON "ProjectSignal"("status");

-- AddForeignKey
ALTER TABLE "PromptConfig" ADD CONSTRAINT "PromptConfig_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignalWeightConfig" ADD CONSTRAINT "SignalWeightConfig_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
