import {
  getDateArg,
  getStringArg,
  getToday,
  loadScriptEnv,
} from "./script-utils";

loadScriptEnv();

async function main() {
  const { generateDailyChatSummariesForDate } = await import(
    "../src/lib/chat-summary-service"
  );
  const { prisma } = await import("../src/lib/prisma");

  const date = getDateArg(getToday());
  const workspaceId = getStringArg("workspace-id");
  const projectId = getStringArg("project-id");

  console.log("🚀 Daily chat summaries");
  console.log(`Date: ${date.toISOString().slice(0, 10)}`);

  const result = await generateDailyChatSummariesForDate({
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
        projectsFound: result.projectsFound,
        projectsWithMessages: result.projectsWithMessages,
        summariesCreated: result.summariesCreated,
        summariesUpdated: result.summariesUpdated,
        skippedProjects: result.skippedProjects,
        failedProjects: result.failedProjects,
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
  console.error("❌ Daily chat summaries failed");
  console.error(error);
  process.exit(1);
});
