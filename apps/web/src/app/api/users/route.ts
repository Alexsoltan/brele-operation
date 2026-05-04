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

export async function GET() {
  let currentUser: Awaited<ReturnType<typeof requireCanManageUsers>>;

  try {
    currentUser = await requireCanManageUsers();
  } catch (error) {
    const response = authErrorResponse(error);
    if (response) return response;
    throw error;
  }

  const users = await prisma.user.findMany({
    where: {
      workspaceId: currentUser.workspaceId,
      deletedAt: null,
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(users.map(serializeUser));
}

export async function POST(req: NextRequest) {
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
  const role = isUserRole(body?.role) ? body.role : "ANALYST";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, deletedAt: true },
  });

  if (existing && !existing.deletedAt) {
    return NextResponse.json(
      { error: "User with this email already exists" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          workspaceId: currentUser.workspaceId,
          email,
          name,
          role,
          passwordHash,
          deletedAt: null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    : await prisma.user.create({
        data: {
          workspaceId: currentUser.workspaceId,
          email,
          name,
          role,
          passwordHash,
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

  return NextResponse.json(serializeUser(user), { status: 201 });
}
