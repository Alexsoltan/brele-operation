import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  const projects = await prisma.project.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const name = String(body?.name ?? "").trim();
  const client = String(body?.client ?? body?.clientName ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      slug: slugify(name),
      name,
      client: client || null,
      status: "active",
      clientMood: "neutral",
      teamMood: "neutral",
      risk: "low",
    },
  });

  return NextResponse.json(project, { status: 201 });
}