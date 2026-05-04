/*
  Warnings:

  - You are about to drop the column `category` on the `SignalWeightConfig` table. All the data in the column will be lost.
  - You are about to drop the column `direction` on the `SignalWeightConfig` table. All the data in the column will be lost.
  - You are about to drop the column `severity` on the `SignalWeightConfig` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[workspaceId,type]` on the table `SignalWeightConfig` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "SignalWeightConfig_category_idx";

-- DropIndex
DROP INDEX "SignalWeightConfig_severity_idx";

-- DropIndex
DROP INDEX "SignalWeightConfig_workspaceId_category_type_direction_seve_key";

-- AlterTable
ALTER TABLE "SignalWeightConfig" DROP COLUMN "category",
DROP COLUMN "direction",
DROP COLUMN "severity";

-- CreateIndex
CREATE UNIQUE INDEX "SignalWeightConfig_workspaceId_type_key" ON "SignalWeightConfig"("workspaceId", "type");
