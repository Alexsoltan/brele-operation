import { NextRequest, NextResponse } from "next/server";

import { requireCanManageMeetings, requireCanRead } from "@/lib/auth";
import { encryptMailPassword } from "@/lib/mail-passwords";
import { prisma } from "@/lib/prisma";

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function serializeAccount(account: any) {
  return {
    id: account.id,
    userId: account.userId,
    email: account.email,
    displayName: account.displayName,
    imapHost: account.imapHost,
    imapPort: account.imapPort,
    imapSecure: account.imapSecure,
    username: account.username,
    isActive: account.isActive,
    lastSyncAt: account.lastSyncAt,
    lastSyncUid: account.lastSyncUid,
    syncError: account.syncError,
    user: account.user
      ? {
          id: account.user.id,
          name: account.user.name,
          email: account.user.email,
        }
      : null,
  };
}

export async function GET() {
  const user = await requireCanRead();

  const accounts = await prisma.mailAccount.findMany({
    where: {
      workspaceId: user.workspaceId,
      userId: user.id,
      deletedAt: null,
    },
    include: {
      user: true,
    },
    orderBy: {
      email: "asc",
    },
  });

  return NextResponse.json(accounts.map(serializeAccount));
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireCanManageMeetings();
    const body = await req.json();

    const email = normalizeEmail(body?.email);
    const username = String(body?.username ?? email).trim();
    const password = String(body?.password ?? "");
    const imapHost = String(body?.imapHost ?? "imap.yandex.ru").trim();
    const imapPort = Number(body?.imapPort ?? 993);
    const imapSecure =
      typeof body?.imapSecure === "boolean" ? body.imapSecure : true;

    if (!email || !username || !password || !imapHost || !imapPort) {
      return NextResponse.json(
        { error: "Email, username, password and IMAP settings are required" },
        { status: 400 },
      );
    }

    const encrypted = encryptMailPassword(password);

    const account = await prisma.mailAccount.upsert({
      where: {
        workspaceId_email: {
          workspaceId: user.workspaceId,
          email,
        },
      },
      create: {
        workspaceId: user.workspaceId,
        userId: user.id,
        email,
        displayName:
          typeof body?.displayName === "string" && body.displayName.trim()
            ? body.displayName.trim()
            : null,
        imapHost,
        imapPort,
        imapSecure,
        username,
        ...encrypted,
        isActive: true,
        deletedAt: null,
      },
      update: {
        userId: user.id,
        displayName:
          typeof body?.displayName === "string" && body.displayName.trim()
            ? body.displayName.trim()
            : null,
        imapHost,
        imapPort,
        imapSecure,
        username,
        ...encrypted,
        isActive: true,
        deletedAt: null,
        syncError: null,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(serializeAccount(account), { status: 201 });
  } catch (error) {
    console.error("MAIL ACCOUNT SAVE ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не удалось сохранить подключение почты.",
      },
      { status: 500 },
    );
  }
}
