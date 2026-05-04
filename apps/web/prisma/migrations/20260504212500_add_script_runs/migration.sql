CREATE TABLE "ScriptRun" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "userId" TEXT,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "title" TEXT NOT NULL,
    "input" JSONB,
    "result" JSONB,
    "logs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScriptRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ScriptRun_workspaceId_idx" ON "ScriptRun"("workspaceId");
CREATE INDEX "ScriptRun_userId_idx" ON "ScriptRun"("userId");
CREATE INDEX "ScriptRun_kind_idx" ON "ScriptRun"("kind");
CREATE INDEX "ScriptRun_status_idx" ON "ScriptRun"("status");
CREATE INDEX "ScriptRun_createdAt_idx" ON "ScriptRun"("createdAt");

ALTER TABLE "ScriptRun" ADD CONSTRAINT "ScriptRun_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScriptRun" ADD CONSTRAINT "ScriptRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
