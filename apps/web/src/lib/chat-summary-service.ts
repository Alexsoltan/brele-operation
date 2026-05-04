import { prisma } from "@/lib/prisma";
import type { Mood, Risk } from "@/lib/types";

type ChatParticipantForSummary = {
  telegramUserId: string;
  role: "client" | "team" | "unknown" | "ignore";
};

type ChatMessageForSummary = {
  authorTelegramId: string | null;
  authorUsername: string | null;
  authorName: string | null;
  text: string;
  date: Date;
};

type ProjectChatForSummary = {
  telegramChatId: string;
  title: string | null;
  participants: ChatParticipantForSummary[];
  messages: ChatMessageForSummary[];
};

type FlattenedMessage = {
  chatTitle: string;
  authorName: string;
  authorRole: string;
  date: Date;
  text: string;
};

type GenerateDailyChatSummariesOptions = {
  date?: Date;
  workspaceId?: string | null;
  projectId?: string;
};

type GenerateDailyChatSummariesResult = {
  date: string;
  projectsFound: number;
  projectsWithMessages: number;
  summariesCreated: number;
  summariesUpdated: number;
  skippedProjects: number;
  failedProjects: number;
  logs: string[];
};

function getDayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

function normalizeMood(value: unknown): Mood {
  if (value === "good" || value === "neutral" || value === "bad") return value;
  return "neutral";
}

function normalizeRisk(value: unknown): Risk {
  if (value === "low" || value === "medium" || value === "high") return value;
  return "low";
}

export async function generateDailyChatSummaries() {
  return generateDailyChatSummariesForDate();
}

export async function generateDailyChatSummariesForDate(
  options: GenerateDailyChatSummariesOptions = {},
): Promise<GenerateDailyChatSummariesResult> {
  const aiProxyUrl = process.env.AI_PROXY_URL;
  const aiProxyKey = process.env.AI_PROXY_KEY;

  if (!aiProxyUrl || !aiProxyKey) {
    throw new Error("AI proxy not configured");
  }

  const { start, end } = getDayRange(options.date ?? new Date());
  const dateKey = start.toISOString().slice(0, 10);
  const logs: string[] = [];

  const projects = await prisma.project.findMany({
    where: {
      id: options.projectId,
      workspaceId:
        options.workspaceId === undefined ? undefined : options.workspaceId,
      deletedAt: null,
      projectChats: { some: { isActive: true } },
    },
    include: {
      projectChats: {
        where: { isActive: true },
        include: {
          participants: true,
          messages: {
            where: { date: { gte: start, lt: end } },
            orderBy: { date: "asc" },
          },
        },
      },
    },
  });

  logs.push(`Date: ${dateKey}`);
  logs.push(`Projects with active chats: ${projects.length}`);

  let projectsWithMessages = 0;
  let summariesCreated = 0;
  let summariesUpdated = 0;
  let skippedProjects = 0;
  let failedProjects = 0;

  for (const project of projects) {
    try {
      const projectChats = project.projectChats as ProjectChatForSummary[];

      const messages: FlattenedMessage[] = projectChats.flatMap((chat) =>
        chat.messages
          .filter((message) => message.text.trim())
          .map((message) => {
            const participant = chat.participants.find(
              (item) => item.telegramUserId === message.authorTelegramId,
            );

            return {
              chatTitle: chat.title || chat.telegramChatId,
              authorName:
                message.authorName || message.authorUsername || "Unknown",
              authorRole: participant?.role || "unknown",
              date: message.date,
              text: message.text,
            };
          }),
      );

      if (messages.length === 0) {
        skippedProjects++;
        logs.push(`Skipped ${project.name}: no messages`);
        continue;
      }

      projectsWithMessages++;
      logs.push(`Analyzing ${project.name}: ${messages.length} messages`);

      const existing = await prisma.chatDailySummary.findUnique({
        where: {
          projectId_date: {
            projectId: project.id,
            date: start,
          },
        },
        select: { id: true },
      });

      const text = [
        `Проект: ${project.name}`,
        `Клиент: ${project.client || "не указан"}`,
        `Дата: ${dateKey}`,
        "",
        "Сообщения за день:",
        ...messages.map((message) =>
          [
            `[${message.date.toISOString()}]`,
            `чат: ${message.chatTitle}`,
            `автор: ${message.authorName}`,
            `роль: ${message.authorRole}`,
            `текст: ${message.text}`,
          ].join(" | "),
        ),
      ].join("\n");

      const response = await fetch(`${aiProxyUrl}/analyze-chat-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${aiProxyKey}`,
        },
        body: JSON.stringify({ text }),
      });

      const responseText = await response.text();

      let data: Record<string, unknown> = {};

      try {
        data = JSON.parse(responseText) as Record<string, unknown>;
      } catch {
        data = { error: responseText.slice(0, 500) };
      }

      if (!response.ok) {
        throw new Error(
          `AI proxy failed: ${response.status}: ${String(
            data.details ?? data.error ?? responseText.slice(0, 500),
          )}`,
        );
      }

      await prisma.chatDailySummary.upsert({
        where: {
          projectId_date: {
            projectId: project.id,
            date: start,
          },
        },
        update: {
          summary:
            typeof data.summary === "string"
              ? data.summary
              : "Саммари не получено.",
          highlights: Array.isArray(data.highlights)
            ? data.highlights.filter(
                (item): item is string => typeof item === "string",
              )
            : [],
          clientMood: normalizeMood(data.clientMood),
          teamMood: normalizeMood(data.teamMood),
          risk: normalizeRisk(data.risk),
        },
        create: {
          projectId: project.id,
          date: start,
          summary:
            typeof data.summary === "string"
              ? data.summary
              : "Саммари не получено.",
          highlights: Array.isArray(data.highlights)
            ? data.highlights.filter(
                (item): item is string => typeof item === "string",
              )
            : [],
          clientMood: normalizeMood(data.clientMood),
          teamMood: normalizeMood(data.teamMood),
          risk: normalizeRisk(data.risk),
        },
      });

      if (existing) {
        summariesUpdated++;
        logs.push(`Updated summary for ${project.name}`);
      } else {
        summariesCreated++;
        logs.push(`Created summary for ${project.name}`);
      }
    } catch (error) {
      failedProjects++;
      logs.push(
        `Failed ${project.name}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  return {
    date: dateKey,
    projectsFound: projects.length,
    projectsWithMessages,
    summariesCreated,
    summariesUpdated,
    skippedProjects,
    failedProjects,
    logs,
  };
}
