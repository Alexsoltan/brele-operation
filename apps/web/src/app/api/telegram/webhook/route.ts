import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type TelegramMessageFrom = {
  id?: number | string;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_bot?: boolean;
};

type TelegramWebhookBody = {
  message?: {
    message_id?: number;
    date?: number;
    text?: string;
    chat?: {
      id?: number | string;
      title?: string;
      type?: string;
    };
    from?: TelegramMessageFrom;
  };
};

function buildAuthorName(from?: TelegramMessageFrom) {
  const fullName = [from?.first_name, from?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || from?.username || null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TelegramWebhookBody;
    const message = body.message;

    if (!message?.chat?.id || !message.message_id || !message.date) {
      return NextResponse.json({ ok: true });
    }

    if (!message.text?.trim()) {
      return NextResponse.json({ ok: true });
    }

    if (message.from?.is_bot) {
      return NextResponse.json({ ok: true });
    }

    const telegramChatId = String(message.chat.id);
        const telegramMessageId = String(message.message_id);
    const authorTelegramId = message.from?.id ? String(message.from.id) : null;
    const authorUsername = message.from?.username ?? null;
    const authorName = buildAuthorName(message.from);
    const text = message.text.trim();
    const date = new Date(message.date * 1000);

    const projectChat = await prisma.projectChat.findFirst({
      where: {
        telegramChatId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!projectChat) {
      return NextResponse.json({ ok: true });
    }

    if (authorTelegramId) {
      await prisma.projectChatParticipant.upsert({
        where: {
          projectChatId_telegramUserId: {
            projectChatId: projectChat.id,
            telegramUserId: authorTelegramId,
          },
        },
        update: {
          username: authorUsername,
          name: authorName,
        },
        create: {
          projectChatId: projectChat.id,
          telegramUserId: authorTelegramId,
          username: authorUsername,
          name: authorName,
          role: "unknown",
        },
      });
    }

    await prisma.chatMessage.upsert({
      where: {
        projectChatId_telegramMessageId: {
          projectChatId: projectChat.id,
          telegramMessageId,
        },
      },
      update: {
        authorTelegramId,
        authorUsername,
        authorName,
        text,
        date,
      },
      create: {
        projectChatId: projectChat.id,
        telegramMessageId,
        authorTelegramId,
        authorUsername,
        authorName,
        text,
        date,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}