import { prisma } from "@/lib/prisma";
import type { Mood, Risk } from "@/lib/types";
import { extractSignalsFromChatSummary } from "@/lib/signal-extractors";

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

function normalizeMood(value: unknown): Mood {
  if (value === "good" || value === "neutral" || value === "bad") return value;
  return "neutral";
}

function normalizeRisk(value: unknown): Risk {
  if (value === "low" || value === "medium" || value === "high") return value;
  return "low";
}

export async function generateDailyChatSummaries() {
  const aiProxyUrl = process.env.AI_PROXY_URL;
  const aiProxyKey = process.env.AI_PROXY_KEY;

  if (!aiProxyUrl || !aiProxyKey) {
    throw new Error("AI proxy not configured");
  }

  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);

  const end = new Date(today);
  end.setHours(23, 59, 59, 999);

  const projects = await prisma.project.findMany({
    where: {
      deletedAt: null,
      projectChats: { some: { isActive: true } },
    },
    include: {
      projectChats: {
        where: { isActive: true },
        include: {
          participants: true,
          messages: {
            where: { date: { gte: start, lte: end } },
            orderBy: { date: "asc" },
          },
        },
      },
    },
  });

  for (const project of projects) {
    const projectChats = project.projectChats as ProjectChatForSummary[];

    const messages: FlattenedMessage[] = projectChats.flatMap((chat) =>
      chat.messages.map((message) => {
        const participant = chat.participants.find(
          (item) => item.telegramUserId === message.authorTelegramId,
        );

        return {
          chatTitle: chat.title || chat.telegramChatId,
          authorName: message.authorName || message.authorUsername || "Unknown",
          authorRole: participant?.role || "unknown",
          date: message.date,
          text: message.text,
        };
      }),
    );

    if (messages.length === 0) continue;

    const text = [
      `Проект: ${project.name}`,
      `Клиент: ${project.client || "не указан"}`,
      `Дата: ${start.toISOString().slice(0, 10)}`,
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

    const data = await response.json();

    if (!response.ok) {
      console.error("AI CHAT SUMMARY ERROR", data);
      continue;
    }

    const chatSummary = await prisma.chatDailySummary.upsert({
      where: {
        projectId_date: {
          projectId: project.id,
          date: start,
        },
      },
      update: {
        summary: data.summary || "Саммари не получено.",
        highlights: Array.isArray(data.highlights) ? data.highlights : [],
        clientMood: normalizeMood(data.clientMood),
        teamMood: normalizeMood(data.teamMood),
        risk: normalizeRisk(data.risk),
      },
      create: {
        projectId: project.id,
        date: start,
        summary: data.summary || "Саммари не получено.",
        highlights: Array.isArray(data.highlights) ? data.highlights : [],
        clientMood: normalizeMood(data.clientMood),
        teamMood: normalizeMood(data.teamMood),
        risk: normalizeRisk(data.risk),
      },
    });

    await extractSignalsFromChatSummary(chatSummary);
  }
}