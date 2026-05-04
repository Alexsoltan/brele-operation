import { analyzeProjectDay } from "@/lib/ai-analysis/analyze-project-day";
import { prisma } from "@/lib/prisma";

export async function POST() {
  // 1. берём все проекты
  const projects = await prisma.project.findMany();

  for (const project of projects) {
    // 2. берём все даты встреч
    const meetings = await prisma.meeting.findMany({
      where: { projectId: project.id },
      select: { date: true },
    });

    const dates = Array.from(
      new Set(
        meetings.map((m: { date: Date }) => m.date.toISOString())
      )
    ) as string[];
    for (const date of dates) {
      await analyzeProjectDay(project.id, new Date(date));
    }
  }

  return Response.json({ ok: true });
}