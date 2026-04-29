import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCanManageProjects, requireCanRead } from "@/lib/auth";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  const user = await requireCanRead();

  const meetingTypes = await prisma.meetingType.findMany({
    where: {
      workspaceId: user.workspaceId,
      deletedAt: null,
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(meetingTypes);
}

export async function POST(req: NextRequest) {
  const user = await requireCanManageProjects();
  const body = await req.json();

  const name = String(body?.name ?? "").trim();
  const description = String(body?.description ?? "").trim();
  const prompt = String(body?.prompt ?? "").trim();

  if (!name) {
    return NextResponse.json(
      { error: "Meeting type name is required" },
      { status: 400 },
    );
  }

  if (!prompt) {
    return NextResponse.json(
      { error: "Meeting type prompt is required" },
      { status: 400 },
    );
  }

  const meetingType = await prisma.meetingType.create({
    data: {
      workspaceId: user.workspaceId,
      name,
      slug: `${slugify(name)}-${Date.now()}`,
      description: description || null,
      prompt,
      isDefault: false,
    },
  });

  return NextResponse.json(meetingType, { status: 201 });
}