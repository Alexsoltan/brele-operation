import {
  getDateArg,
  getStringArg,
  getToday,
  loadScriptEnv,
} from "./script-utils";

loadScriptEnv();

async function main() {
  const { generateDailyProjectSignalsForDate } = await import(
    "../src/lib/daily-operations"
  );
  const { prisma } = await import("../src/lib/prisma");

  const date = getDateArg(getToday());
  const workspaceId = getStringArg("workspace-id");
  const projectId = getStringArg("project-id");

  console.log("🚀 Daily project signals");

  const result = await generateDailyProjectSignalsForDate({
    date,
    workspaceId,
    projectId,
  });

  for (const line of result.logs) {
    console.log(line);
  }

  console.log("✅ Done");
  console.log(
    JSON.stringify(
      {
        date: result.date,
        totalProjects: result.totalProjects,
        processedProjects: result.processedProjects,
        failedProjects: result.failedProjects,
        createdSignals: result.createdSignals,
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();

  if (result.failedProjects > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("❌ Daily project signals failed");
  console.error(error);
  process.exit(1);
});
