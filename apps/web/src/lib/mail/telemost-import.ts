import crypto from "node:crypto";
import type { Attachment, ParsedMail } from "mailparser";

import { decryptMailPassword } from "@/lib/mail-passwords";
import { prisma } from "@/lib/prisma";

type ImportResult = {
  accountId: string;
  email: string;
  imported: number;
  skipped: number;
  error?: string;
};

type ImportOptions = {
  workspaceId?: string | null;
  userId?: string | null;
  accountId?: string | null;
};

function getAddressValue(value: unknown) {
  const addresses = (value as { value?: { address?: string; name?: string }[] })
    ?.value;
  return addresses?.[0] ?? null;
}

function isTelemostMessage(params: { fromEmail?: string | null; subject: string }) {
  return (
    params.fromEmail?.toLowerCase() === "keeper@telemost.yandex.ru" ||
    params.subject.toLowerCase().includes("конспект встречи")
  );
}

function getTextContent(content: unknown) {
  if (Buffer.isBuffer(content)) return content.toString("utf8");
  if (typeof content === "string") return content;
  if (content instanceof Uint8Array) return Buffer.from(content).toString("utf8");
  return "";
}

function extractTelemostUrl(text: string) {
  return text.match(/https:\/\/telemost\.360\.yandex\.ru\/j\/[0-9]+/)?.[0] ?? null;
}

function extractTelemostId(url: string | null) {
  return url?.match(/\/j\/([0-9]+)/)?.[1] ?? null;
}

function createContentHash(params: {
  messageId?: string | null;
  attachmentFileName: string;
  transcriptText: string;
}) {
  return crypto
    .createHash("sha256")
    .update(params.messageId ?? "")
    .update("|")
    .update(params.attachmentFileName)
    .update("|")
    .update(params.transcriptText)
    .digest("hex");
}

function getTodayStart() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function importTelemostMeetingDrafts(options: ImportOptions = {}) {
  const { ImapFlow } = await import("imapflow");
  const { simpleParser } = await import("mailparser");

  const accounts = await prisma.mailAccount.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      ...(options.workspaceId ? { workspaceId: options.workspaceId } : {}),
      ...(options.userId ? { userId: options.userId } : {}),
      ...(options.accountId ? { id: options.accountId } : {}),
    },
  });

  const results: ImportResult[] = [];

  for (const account of accounts) {
    let imported = 0;
    let skipped = 0;
    let maxUid = account.lastSyncUid ?? 0;

    const client = new ImapFlow({
      host: account.imapHost,
      port: account.imapPort,
      secure: account.imapSecure,
      auth: {
        user: account.username,
        pass: decryptMailPassword({
          encryptedPassword: account.encryptedPassword,
          passwordNonce: account.passwordNonce,
          passwordAuthTag: account.passwordAuthTag,
        }),
      },
    });

    try {
      await client.connect();

      const lock = await client.getMailboxLock("INBOX");

      try {
        const firstSyncSince = account.lastSyncUid ? null : getTodayStart();
        const range = account.lastSyncUid ? `${account.lastSyncUid + 1}:*` : "1:*";

        for await (const message of client.fetch(
          range,
          {
            uid: true,
            envelope: true,
            internalDate: true,
            source: true,
          },
          { uid: true },
          )) {
          maxUid = Math.max(maxUid, Number(message.uid ?? 0));

          const messageDate = message.internalDate ?? message.envelope?.date ?? null;

          if (firstSyncSince && messageDate && messageDate < firstSyncSince) {
            skipped += 1;
            continue;
          }

          if (!message.source) {
            skipped += 1;
            continue;
          }

          const parsed = (await simpleParser(message.source)) as ParsedMail;
          const subject = parsed.subject ?? "";
          const from = getAddressValue(parsed.from);
          const fromEmail = from?.address ?? null;

          if (!isTelemostMessage({ fromEmail, subject })) {
            skipped += 1;
            continue;
          }

          const txtAttachments = parsed.attachments.filter((attachment: Attachment) => {
            const fileName = attachment.filename ?? "";
            return (
              fileName.toLowerCase().endsWith(".txt") ||
              attachment.contentType === "text/plain"
            );
          });

          if (txtAttachments.length === 0) {
            skipped += 1;
            continue;
          }

          for (const attachment of txtAttachments) {
            const transcriptText = getTextContent(attachment.content).trim();

            if (!transcriptText) {
              skipped += 1;
              continue;
            }

            const telemostMeetingUrl = extractTelemostUrl(transcriptText);
            const attachmentFileName =
              attachment.filename ?? `telemost-${message.uid}.txt`;
            const contentHash = createContentHash({
              messageId: parsed.messageId,
              attachmentFileName,
              transcriptText,
            });

            const existing = await prisma.inboundMeetingDraft.findFirst({
              where: {
                workspaceId: account.workspaceId,
                contentHash,
              },
            });

            if (existing) {
              skipped += 1;
              continue;
            }

            await prisma.inboundMeetingDraft.create({
              data: {
                workspaceId: account.workspaceId,
                mailAccountId: account.id,
                managerUserId: account.userId,
                sourceEmail: account.email,
                fromEmail,
                fromName: from?.name ?? null,
                emailSubject: subject || "Конспект встречи",
                messageId: parsed.messageId ?? null,
                emailDate: parsed.date ?? null,
                receivedAt: message.internalDate ?? null,
                attachmentFileName,
                contentHash,
                telemostMeetingUrl,
                telemostMeetingId: extractTelemostId(telemostMeetingUrl),
                transcriptText,
              },
            });

            imported += 1;
          }
        }
      } finally {
        lock.release();
      }

      await client.logout();

      await prisma.mailAccount.update({
        where: {
          id: account.id,
        },
        data: {
          lastSyncAt: new Date(),
          lastSyncUid: maxUid || account.lastSyncUid,
          syncError: null,
        },
      });

      results.push({ accountId: account.id, email: account.email, imported, skipped });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      await prisma.mailAccount.update({
        where: {
          id: account.id,
        },
        data: {
          lastSyncAt: new Date(),
          syncError: message,
        },
      });

      results.push({
        accountId: account.id,
        email: account.email,
        imported,
        skipped,
        error: message,
      });
    }
  }

  return results;
}
