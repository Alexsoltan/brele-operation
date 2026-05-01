-- CreateTable
CREATE TABLE "ProjectChat" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "telegramChatId" TEXT NOT NULL,
    "title" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "projectChatId" TEXT NOT NULL,
    "telegramMessageId" TEXT NOT NULL,
    "authorTelegramId" TEXT,
    "authorUsername" TEXT,
    "authorName" TEXT,
    "text" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatDailySummary" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "clientMood" "Mood" NOT NULL DEFAULT 'neutral',
    "teamMood" "Mood" NOT NULL DEFAULT 'neutral',
    "risk" "Risk" NOT NULL DEFAULT 'low',
    "summary" TEXT NOT NULL,
    "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatDailySummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectChat_telegramChatId_key" ON "ProjectChat"("telegramChatId");

-- CreateIndex
CREATE INDEX "ProjectChat_projectId_idx" ON "ProjectChat"("projectId");

-- CreateIndex
CREATE INDEX "ProjectChat_telegramChatId_idx" ON "ProjectChat"("telegramChatId");

-- CreateIndex
CREATE INDEX "ProjectChat_isActive_idx" ON "ProjectChat"("isActive");

-- CreateIndex
CREATE INDEX "ChatMessage_projectChatId_idx" ON "ChatMessage"("projectChatId");

-- CreateIndex
CREATE INDEX "ChatMessage_date_idx" ON "ChatMessage"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessage_projectChatId_telegramMessageId_key" ON "ChatMessage"("projectChatId", "telegramMessageId");

-- CreateIndex
CREATE INDEX "ChatDailySummary_projectId_idx" ON "ChatDailySummary"("projectId");

-- CreateIndex
CREATE INDEX "ChatDailySummary_date_idx" ON "ChatDailySummary"("date");

-- CreateIndex
CREATE INDEX "ChatDailySummary_risk_idx" ON "ChatDailySummary"("risk");

-- CreateIndex
CREATE UNIQUE INDEX "ChatDailySummary_projectId_date_key" ON "ChatDailySummary"("projectId", "date");

-- AddForeignKey
ALTER TABLE "ProjectChat" ADD CONSTRAINT "ProjectChat_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_projectChatId_fkey" FOREIGN KEY ("projectChatId") REFERENCES "ProjectChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatDailySummary" ADD CONSTRAINT "ChatDailySummary_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
