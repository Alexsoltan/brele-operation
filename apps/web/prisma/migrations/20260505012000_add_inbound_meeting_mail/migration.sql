CREATE TYPE "InboundMeetingStatus" AS ENUM ('new', 'linked', 'ignored', 'error');

CREATE TABLE "MailAccount" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "imapHost" TEXT NOT NULL,
    "imapPort" INTEGER NOT NULL DEFAULT 993,
    "imapSecure" BOOLEAN NOT NULL DEFAULT true,
    "username" TEXT NOT NULL,
    "encryptedPassword" TEXT NOT NULL,
    "passwordNonce" TEXT NOT NULL,
    "passwordAuthTag" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncUid" INTEGER,
    "syncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MailAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InboundMeetingDraft" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "mailAccountId" TEXT,
    "managerUserId" TEXT,
    "linkedMeetingId" TEXT,
    "status" "InboundMeetingStatus" NOT NULL DEFAULT 'new',
    "sourceEmail" TEXT NOT NULL,
    "fromEmail" TEXT,
    "fromName" TEXT,
    "emailSubject" TEXT NOT NULL,
    "messageId" TEXT,
    "emailDate" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "attachmentFileName" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "telemostMeetingUrl" TEXT,
    "telemostMeetingId" TEXT,
    "transcriptText" TEXT NOT NULL,
    "error" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "InboundMeetingDraft_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MailAccount_workspaceId_email_key" ON "MailAccount"("workspaceId", "email");
CREATE INDEX "MailAccount_workspaceId_idx" ON "MailAccount"("workspaceId");
CREATE INDEX "MailAccount_userId_idx" ON "MailAccount"("userId");
CREATE INDEX "MailAccount_isActive_idx" ON "MailAccount"("isActive");
CREATE INDEX "MailAccount_deletedAt_idx" ON "MailAccount"("deletedAt");

CREATE UNIQUE INDEX "InboundMeetingDraft_workspaceId_contentHash_key" ON "InboundMeetingDraft"("workspaceId", "contentHash");
CREATE INDEX "InboundMeetingDraft_workspaceId_idx" ON "InboundMeetingDraft"("workspaceId");
CREATE INDEX "InboundMeetingDraft_mailAccountId_idx" ON "InboundMeetingDraft"("mailAccountId");
CREATE INDEX "InboundMeetingDraft_managerUserId_idx" ON "InboundMeetingDraft"("managerUserId");
CREATE INDEX "InboundMeetingDraft_linkedMeetingId_idx" ON "InboundMeetingDraft"("linkedMeetingId");
CREATE INDEX "InboundMeetingDraft_status_idx" ON "InboundMeetingDraft"("status");
CREATE INDEX "InboundMeetingDraft_emailDate_idx" ON "InboundMeetingDraft"("emailDate");
CREATE INDEX "InboundMeetingDraft_deletedAt_idx" ON "InboundMeetingDraft"("deletedAt");

ALTER TABLE "MailAccount" ADD CONSTRAINT "MailAccount_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MailAccount" ADD CONSTRAINT "MailAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InboundMeetingDraft" ADD CONSTRAINT "InboundMeetingDraft_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InboundMeetingDraft" ADD CONSTRAINT "InboundMeetingDraft_mailAccountId_fkey" FOREIGN KEY ("mailAccountId") REFERENCES "MailAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InboundMeetingDraft" ADD CONSTRAINT "InboundMeetingDraft_managerUserId_fkey" FOREIGN KEY ("managerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InboundMeetingDraft" ADD CONSTRAINT "InboundMeetingDraft_linkedMeetingId_fkey" FOREIGN KEY ("linkedMeetingId") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;
