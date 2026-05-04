import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";

import { requireCanManageUsers } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const USER_ROLES = ["ADMIN", "MANAGER", "ANALYST"] as const;

function isUserRole(value: unknown): value is (typeof USER_ROLES)[number] {
  return typeof value === "string" && USER_ROLES.includes(value as never);
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeName(value: unknown) {
  if (typeof value !== "string") return null;
  const name = value.trim();
  return name || null;
}

function serializeUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function authErrorResponse(error: unknown) {
  if (error instanceof Error && error.message === "Unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (error instanceof Error && error.message === "Forbidden") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
  let currentUser: Awaited<ReturnType<typeof requireCanManageUsers>>;

  try {
    currentUser = await requireCanManageUsers();
  } catch (error) {
    const response = authErrorResponse(error);
    if (response) return response;
    throw error;
  }

  const body = await req.json().catch(() => ({}));

  const email = normalizeEmail(body?.email);
  const name = normalizeName(body?.name);
  const role = isUserRole(body?.role) ? body.role : null;
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (!role) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      id: params.userId,
      workspaceId: currentUser.workspaceId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const emailOwner = await prisma.user.findUnique({
    where: { email },
    select: { id: true, deletedAt: true },
  });

  if (emailOwner && emailOwner.id !== params.userId && !emailOwner.deletedAt) {
    return NextResponse.json(
      { error: "User with this email already exists" },
      { status: 409 },
    );
  }

  const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

  const updated = await prisma.user.update({
    where: { id: params.userId },
    data: {
      email,
      name,
      role,
      ...(passwordHash ? { passwordHash } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(serializeUser(updated));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { userId: string } },
) {
  let currentUser: Awaited<ReturnType<typeof requireCanManageUsers>>;

  try {
    currentUser = await requireCanManageUsers();
  } catch (error) {
    const response = authErrorResponse(error);
    if (response) return response;
    throw error;
  }

  if (params.userId === currentUser.id) {
    return NextResponse.json(
      { error: "You cannot delete your own user" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      id: params.userId,
      workspaceId: currentUser.workspaceId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: params.userId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
