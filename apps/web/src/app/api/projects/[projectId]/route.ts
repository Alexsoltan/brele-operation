import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCanManageProjects, requireCanRead } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ projectId: string }> },
) {
  const user = await requireCanRead();
  const { projectId } = await context.params;

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspaceId: user.workspaceId,
      deletedAt: null,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> },
) {
  const user = await requireCanManageProjects();
  const { projectId } = await context.params;
  const body = await req.json();

  const existingProject = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspaceId: user.workspaceId,
      deletedAt: null,
    },
  });

  if (!existingProject) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const project = await prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      name: typeof body?.name === "string" ? body.name : undefined,
      client: typeof body?.client === "string" ? body.client : undefined,
      status: body?.status,
      clientMood: body?.clientMood,
      teamMood: body?.teamMood,
      risk: body?.risk,
    },
  });

  return NextResponse.json(project);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ projectId: string }> },
) {
  const user = await requireCanManageProjects();
  const { projectId } = await context.params;

  const existingProject = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspaceId: user.workspaceId,
      deletedAt: null,
    },
  });

  if (!existingProject) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const project = await prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  return NextResponse.json(project);
}