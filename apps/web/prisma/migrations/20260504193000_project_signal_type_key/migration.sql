ALTER TABLE "ProjectSignal" ADD COLUMN "typeKey" TEXT;
ALTER TABLE "ProjectSignal" ADD COLUMN "typeLabel" TEXT;

UPDATE "ProjectSignal"
SET
  "typeKey" = "type"::TEXT,
  "typeLabel" = COALESCE(
    (
      SELECT "SignalTypeConfig"."label"
      FROM "SignalTypeConfig"
      WHERE "SignalTypeConfig"."key" = "ProjectSignal"."type"::TEXT
      ORDER BY
        CASE
          WHEN "SignalTypeConfig"."workspaceId" IS NULL THEN 1
          ELSE 0
        END,
        "SignalTypeConfig"."sortOrder" ASC
      LIMIT 1
    ),
    "type"::TEXT
  );

ALTER TABLE "ProjectSignal" ALTER COLUMN "typeKey" SET NOT NULL;

DROP INDEX IF EXISTS "ProjectSignal_type_idx";

ALTER TABLE "ProjectSignal" DROP COLUMN "category";
ALTER TABLE "ProjectSignal" DROP COLUMN "type";

CREATE INDEX "ProjectSignal_typeKey_idx" ON "ProjectSignal"("typeKey");
