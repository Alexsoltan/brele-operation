-- CreateEnum
CREATE TYPE "SignalSource" AS ENUM ('meeting', 'chat', 'manual');

-- CreateEnum
CREATE TYPE "SignalCategory" AS ENUM ('client', 'team', 'delivery', 'business', 'communication', 'process', 'opportunity');

-- CreateEnum
CREATE TYPE "SignalType" AS ENUM ('client_satisfaction', 'client_dissatisfaction', 'client_trust', 'team_confidence', 'team_demotivation', 'deadline_risk', 'scope_change', 'quality_issue', 'blocker', 'budget_risk', 'communication_gap', 'decision_made', 'escalation', 'positive_feedback', 'upsell_opportunity');

-- CreateEnum
CREATE TYPE "SignalDirection" AS ENUM ('positive', 'negative', 'neutral');

-- CreateEnum
CREATE TYPE "SignalSeverity" AS ENUM ('info', 'low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "SignalStatus" AS ENUM ('active', 'resolved', 'dismissed');

-- CreateTable
CREATE TABLE "ProjectSignal" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "source" "SignalSource" NOT NULL,
    "sourceId" TEXT,
    "category" "SignalCategory" NOT NULL,
    "type" "SignalType" NOT NULL,
    "direction" "SignalDirection" NOT NULL,
    "severity" "SignalSeverity" NOT NULL,
    "status" "SignalStatus" NOT NULL DEFAULT 'active',
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectSignal_projectId_idx" ON "ProjectSignal"("projectId");

-- CreateIndex
CREATE INDEX "ProjectSignal_type_idx" ON "ProjectSignal"("type");

-- CreateIndex
CREATE INDEX "ProjectSignal_severity_idx" ON "ProjectSignal"("severity");

-- CreateIndex
CREATE INDEX "ProjectSignal_occurredAt_idx" ON "ProjectSignal"("occurredAt");

-- AddForeignKey
ALTER TABLE "ProjectSignal" ADD CONSTRAINT "ProjectSignal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
