import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCanManageProjects } from "@/lib/auth";

// PATCH — обновление
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  await requireCanManageProjects();
  const body = await req.json();

  const item = await prisma.signalTypeConfig.update({
    where: { id: params.id },
    data: {
      key: body.key,
      label: body.label,
      isHighRisk: body.isHighRisk,
      direction: body.direction,
      healthImpact: body.healthImpact,
      clientMoodImpact: body.clientMoodImpact,
      teamMoodImpact: body.teamMoodImpact,
      description: body.description,
      isActive: body.isActive,
      sortOrder: body.sortOrder,
    },
  });

  return NextResponse.json(item);
}

// DELETE — мягкое удаление
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  await requireCanManageProjects();
  await prisma.signalTypeConfig.update({
    where: { id: params.id },
    data: {
      isActive: false,
    },
  });

  return NextResponse.json({ success: true });
}
