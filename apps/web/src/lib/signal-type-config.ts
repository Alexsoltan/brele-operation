import { prisma } from "@/lib/prisma";
import type { SignalTypeConfig } from "@/lib/types";

export async function getActiveSignalTypeConfigs(workspaceId?: string | null) {
  const rows = (await prisma.signalTypeConfig.findMany({
    where: {
      isActive: true,
      OR: [{ workspaceId: workspaceId ?? null }, { workspaceId: null }],
    },
    orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
  })) as SignalTypeConfig[];

  const byKey = new Map<string, SignalTypeConfig>();

  for (const row of rows) {
    const current = byKey.get(row.key);

    if (!current || row.workspaceId === (workspaceId ?? null)) {
      byKey.set(row.key, row);
    }
  }

  return Array.from(byKey.values()).sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.key.localeCompare(b.key);
  });
}
