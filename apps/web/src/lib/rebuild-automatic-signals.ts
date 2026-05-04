import { analyzeProjectDay } from "@/lib/ai-analysis/analyze-project-day";
import { prisma } from "@/lib/prisma";
import { recalculateProjectHealth } from "@/lib/recalculate-project-health";

type RebuildOptions = {
  workspaceId: string | null;
  onLog?: (line: string) => void | Promise<void>;
};

export type RebuildAutomaticSignalsResult = {
  ok: boolean;
  processedProjects: number;
  totalProjects: number;
  totalDays: number;
  deletedSignals: number;
  createdSignals: number;
  logs: string[];
};

export async function rebuildAutomaticSignals({
  workspaceId,
  onLog,
}: RebuildOptions): Promise<RebuildAutomaticSignalsResult> {
  const logs: string[] = [];

  async function log(line: string) {
    logs.push(line);
    await onLog?.(line);
  }

  await log("🚀 Старт пересчёта сигналов");

  const deleted = await prisma.projectSignal.deleteMany({
    where: {
      project: {
        workspaceId,
      },
      source: {
        not: "manual",
      },
    },
  });

  await log(`🗑 Удалено авто-сигналов: ${deleted.count}`);

  const projects = await prisma.project.findMany({
    where: { workspaceId },
    select: { id: true, name: true },
  });

  await log(`📦 Найдено проектов: ${projects.length}`);

  let processedProjects = 0;
  let totalDays = 0;
  let createdSignals = 0;

  for (const project of projects) {
    await log(`\n➡️ Проект: ${project.name}`);

    const [meetings, chatMessages] = await Promise.all([
      prisma.meeting.findMany({
        where: { projectId: project.id, deletedAt: null },
        select: { date: true },
      }),
      prisma.chatMessage.findMany({
        where: {
          chat: {
            projectId: project.id,
          },
        },
        select: { date: true },
      }),
    ]);

    const uniqueDates = Array.from(
      new Set(
        [...meetings, ...chatMessages]
          .map((item: { date: Date | null }) =>
            item.date ? item.date.toISOString().slice(0, 10) : null,
          )
          .filter(Boolean),
      ),
    ) as string[];

    await log(`📅 Дней для анализа: ${uniqueDates.length}`);

    for (const dateStr of uniqueDates) {
      try {
        const date = new Date(dateStr);
        const signals = await analyzeProjectDay(project.id, date);

        createdSignals += signals.length;
        totalDays++;
        await log(`   ✅ ${dateStr}: создано сигналов ${signals.length}`);
      } catch (error) {
        await log(
          `   ❌ ${dateStr}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    await recalculateProjectHealth(project.id, workspaceId);
    await log("   📈 Показатели проекта пересчитаны");

    processedProjects++;
  }

  await log("\n🎉 Готово");

  return {
    ok: true,
    processedProjects,
    totalProjects: projects.length,
    totalDays,
    deletedSignals: deleted.count,
    createdSignals,
    logs,
  };
}
