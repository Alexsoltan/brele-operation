import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCanManageProjects, requireCanRead } from "@/lib/auth";
import { getActiveSignalTypeConfigs } from "@/lib/signal-type-config";

// GET — список
export async function GET() {
  const user = await requireCanRead();
  const items = await getActiveSignalTypeConfigs(user.workspaceId ?? null);

  return NextResponse.json(items);
}

// POST — создание
export async function POST(req: Request) {
  const user = await requireCanManageProjects();
  const body = await req.json();

  const item = await prisma.signalTypeConfig.create({
    data: {
      workspaceId: user.workspaceId ?? null,
      key: body.key,
      label: body.label,
      isHighRisk: body.isHighRisk ?? false,
      direction: body.direction ?? "neutral",
      healthImpact: body.healthImpact ?? 0,
      clientMoodImpact: body.clientMoodImpact ?? 0,
      teamMoodImpact: body.teamMoodImpact ?? 0,
      description: body.description ?? null,
      sortOrder: body.sortOrder ?? 0,
    },
  });

  return NextResponse.json(item);
}
