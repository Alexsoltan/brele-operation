import { prisma } from "@/lib/prisma";

type AnalysisSignal = {
  type: string;
  title: string;
  text: string;
  direction: "positive" | "negative" | "neutral";
  severity: "info" | "low" | "medium" | "high" | "critical";
};

export async function createSignalsFromAnalysis(params: {
  projectId: string;
  meetingId: string;
  signals: AnalysisSignal[];
}) {
  const { projectId, meetingId, signals } = params;

  if (!signals.length) return;

  await prisma.projectSignal.createMany({
    data: signals.map((signal) => ({
      projectId,

      source: "meeting",
      sourceId: meetingId,

      type: signal.type,
      category: "communication", // временно (потом можно нормализовать)
      direction: signal.direction,
      severity: signal.severity,

      title: signal.title,
      text: signal.text,

      occurredAt: new Date(),
    })),
  });
}