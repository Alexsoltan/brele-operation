import {
  getDateArg,
  getStringArg,
  getToday,
  loadScriptEnv,
} from "./script-utils";

loadScriptEnv();

async function main() {
  const { generateDailyOperationsForDate } = await import(
    "../src/lib/daily-operations"
  );
  const { prisma } = await import("../src/lib/prisma");

  const date = getDateArg(getToday());
  const workspaceId = getStringArg("workspace-id");
  const projectId = getStringArg("project-id");

  console.log("🚀 Daily operations");
  console.log(`Date: ${date.toISOString().slice(0, 10)}`);

  const result = await generateDailyOperationsForDate({
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
        chatSummaries: {
          projectsFound: result.chatSummaries.projectsFound,
          projectsWithMessages: result.chatSummaries.projectsWithMessages,
          summariesCreated: result.chatSummaries.summariesCreated,
          summariesUpdated: result.chatSummaries.summariesUpdated,
          skippedProjects: result.chatSummaries.skippedProjects,
          failedProjects: result.chatSummaries.failedProjects,
        },
        projectSignals: {
          totalProjects: result.projectSignals.totalProjects,
          processedProjects: result.projectSignals.processedProjects,
          failedProjects: result.projectSignals.failedProjects,
          createdSignals: result.projectSignals.createdSignals,
        },
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();

  if (!result.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("❌ Daily operations failed");
  console.error(error);
  process.exit(1);
});
