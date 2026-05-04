import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCanRead } from "@/lib/auth";
import { analyzeProjectDay } from "@/lib/ai-analysis/analyze-project-day";
import { recalculateProjectHealth } from "@/lib/recalculate-project-health";

export const runtime = "nodejs";

export async function POST() {
  const logs: string[] = [];

  try {
    const user = await requireCanRead();
    const workspaceId = user.workspaceId ?? null;

    logs.push("🚀 Старт пересчёта сигналов");

    /**
     * 1. УДАЛЯЕМ ВСЕ НЕ РУЧНЫЕ СИГНАЛЫ
     */
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

    logs.push(`🗑 Удалено авто-сигналов: ${deleted.count}`);

    /**
     * 2. ПОЛУЧАЕМ ВСЕ ПРОЕКТЫ
     */
    const projects = await prisma.project.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
    });

    logs.push(`📦 Найдено проектов: ${projects.length}`);

    let processedProjects = 0;
    let totalDays = 0;
    let createdSignals = 0;

    /**
     * 3. ИДЕМ ПО ПРОЕКТАМ
     */
    for (const project of projects) {
      logs.push(`\n➡️ Проект: ${project.name}`);

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

      /**
       * 3.2 Получаем даты встреч и чатов
       */
      const uniqueDates = Array.from(
        new Set(
          [...meetings, ...chatMessages]
            .map((m: { date: Date | null }) =>
              m.date ? m.date.toISOString().slice(0, 10) : null,
            )
            .filter(Boolean),
        ),
      ) as string[];

      logs.push(`📅 Дней для анализа: ${uniqueDates.length}`);

      /**
       * 3.3 Анализ по дням
       */
      for (const dateStr of uniqueDates) {
        try {
          const date = new Date(dateStr);

          const signals = await analyzeProjectDay(project.id, date);

          createdSignals += signals.length;
          logs.push(`   ✅ ${dateStr}: создано сигналов ${signals.length}`);
          totalDays++;
        } catch (err) {
          logs.push(`   ❌ ${dateStr}: ${String(err)}`);
        }
      }

      await recalculateProjectHealth(project.id, workspaceId);
      logs.push("   📈 Показатели проекта пересчитаны");

      processedProjects++;
    }

    logs.push("\n🎉 Готово");

    return NextResponse.json({
      ok: true,
      processedProjects,
      totalProjects: projects.length,
      totalDays,
      deletedSignals: deleted.count,
      createdSignals,
      logs,
    });
  } catch (error) {
    console.error("AI ANALYSIS RECALCULATE ERROR:", error);

    logs.push(`❌ Ошибка: ${String(error)}`);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to recalculate",
        logs,
      },
      { status: 500 },
    );
  }
}
