import { prisma } from "../src/lib/prisma";
import { extractSignalsFromMeeting } from "../src/lib/signal-extractors";

async function run() {
  console.log("🚀 Start backfill signals...");

  const meetings = await prisma.meeting.findMany({
    where: {
      deletedAt: null,
      analysisStatus: {
        in: ["analyzed", "manual"], // только те, где есть анализ
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  console.log(`📊 Found ${meetings.length} meetings`);

  let success = 0;
  let failed = 0;

  for (const meeting of meetings) {
    try {
      console.log(`➡️ Processing meeting ${meeting.id}`);

      // ❗ Удаляем старые сигналы от этой встречи (на всякий)
      await prisma.projectSignal.deleteMany({
        where: {
          source: "meeting",
          sourceId: meeting.id,
        },
      });

      await extractSignalsFromMeeting(meeting);

      success++;
    } catch (error) {
      console.error(`❌ Failed meeting ${meeting.id}`, error);
      failed++;
    }
  }

  console.log("✅ Done");
  console.log(`✔ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });