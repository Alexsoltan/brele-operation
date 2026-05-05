import { loadScriptEnv } from "./script-utils";

loadScriptEnv();

async function run() {
  const [{ prisma }, { analyzeAndSaveMeeting }] = await Promise.all([
    import("../src/lib/prisma"),
    import("../src/lib/meeting-analysis"),
  ]);

  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = Number(limitArg?.slice("--limit=".length) ?? 10);

  const meetings = await prisma.meeting.findMany({
    where: {
      deletedAt: null,
      analysisStatus: "pending",
      transcriptText: {
        not: null,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: Number.isFinite(limit) && limit > 0 ? limit : 10,
    select: {
      id: true,
      title: true,
      createdAt: true,
    },
  });

  const results = [];

  for (const meeting of meetings) {
    try {
      const analyzed = await analyzeAndSaveMeeting(meeting.id);

      results.push({
        id: meeting.id,
        title: meeting.title,
        status: analyzed.analysisStatus,
      });
    } catch (error) {
      results.push({
        id: meeting.id,
        title: meeting.title,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        found: meetings.length,
        results,
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
