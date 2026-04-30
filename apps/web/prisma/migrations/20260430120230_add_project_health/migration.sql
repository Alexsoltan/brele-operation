-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "healthCalculatedAt" TIMESTAMP(3),
ADD COLUMN     "healthLabel" TEXT NOT NULL DEFAULT 'stable',
ADD COLUMN     "healthScore" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "healthSummary" TEXT,
ADD COLUMN     "healthTrend" TEXT NOT NULL DEFAULT 'flat';
