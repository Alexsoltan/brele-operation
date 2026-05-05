import { NextRequest, NextResponse } from "next/server";

import { requireCanManageMeetings } from "@/lib/auth";
import { encryptMailPassword } from "@/lib/mail-passwords";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  context: { params: { accountId: string } },
) {
  const user = await requireCanManageMeetings();
  const body = await req.json();

  const existingAccount = await prisma.mailAccount.findFirst({
    where: {
      id: context.params.accountId,
      workspaceId: user.workspaceId,
      userId: user.id,
      deletedAt: null,
    },
  });

  if (!existingAccount) {
    return NextResponse.json({ error: "Mail account not found" }, { status: 404 });
  }

  const password = String(body?.password ?? "");
  const encrypted = password ? encryptMailPassword(password) : {};

  const account = await prisma.mailAccount.update({
    where: {
      id: existingAccount.id,
    },
    data: {
      displayName:
        typeof body?.displayName === "string" && body.displayName.trim()
          ? body.displayName.trim()
          : body?.displayName === null
            ? null
            : undefined,
      email:
        typeof body?.email === "string" && body.email.trim()
          ? body.email.trim().toLowerCase()
          : undefined,
      username:
        typeof body?.username === "string" && body.username.trim()
          ? body.username.trim()
          : undefined,
      imapHost:
        typeof body?.imapHost === "string" && body.imapHost.trim()
          ? body.imapHost.trim()
          : undefined,
      imapPort: body?.imapPort ? Number(body.imapPort) : undefined,
      imapSecure:
        typeof body?.imapSecure === "boolean" ? body.imapSecure : undefined,
      isActive: typeof body?.isActive === "boolean" ? body.isActive : undefined,
      syncError: null,
      ...encrypted,
    },
    include: {
      user: true,
    },
  });

  return NextResponse.json({
    id: account.id,
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
      ? { id: account.user.id, name: account.user.name, email: account.user.email }
      : null,
  });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: { accountId: string } },
) {
  const user = await requireCanManageMeetings();

  const existingAccount = await prisma.mailAccount.findFirst({
    where: {
      id: context.params.accountId,
      workspaceId: user.workspaceId,
      userId: user.id,
      deletedAt: null,
    },
  });

  if (!existingAccount) {
    return NextResponse.json({ error: "Mail account not found" }, { status: 404 });
  }

  const account = await prisma.mailAccount.update({
    where: {
      id: existingAccount.id,
    },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });

  return NextResponse.json(account);
}
