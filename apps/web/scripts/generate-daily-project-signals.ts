import {
  getDateArg,
  getStringArg,
  getYesterday,
  loadScriptEnv,
} from "./script-utils";

loadScriptEnv();

function getDayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

async function main() {
  const { analyzeProjectDay } = await import(
    "../src/lib/ai-analysis/analyze-project-day"
  );
  const { prisma } = await import("../src/lib/prisma");
  const { recalculateProjectHealth } = await import(
    "../src/lib/recalculate-project-health"
  );

  const date = getDateArg(getYesterday());
  const { start, end } = getDayRange(date);
  const dateKey = start.toISOString().slice(0, 10);
  const workspaceId = getStringArg("workspace-id");
  const projectId = getStringArg("project-id");

  console.log("🚀 Daily project signals");
  console.log(`Date: ${dateKey}`);

  const projects = await prisma.project.findMany({
    where: {
      id: projectId,
      workspaceId,
      deletedAt: null,
      OR: [
        {
          meetings: {
            some: {
              deletedAt: null,
              date: {
                gte: start,
                lt: end,
              },
            },
          },
        },
        {
          projectChats: {
            some: {
              messages: {
                some: {
                  date: {
                    gte: start,
                    lt: end,
                  },
                },
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      workspaceId: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log(`Projects with day context: ${projects.length}`);

  let processedProjects = 0;
  let failedProjects = 0;
  let createdSignals = 0;

  for (const project of projects) {
    try {
      console.log(`➡️ ${project.name}`);

      const signals = await analyzeProjectDay(project.id, start);
      createdSignals += signals.length;

      const updatedProject = await recalculateProjectHealth(
        project.id,
        project.workspaceId,
      );

      console.log(
        `   ✅ signals=${signals.length} health=${
          updatedProject?.healthScore ?? "unknown"
        } clientMood=${updatedProject?.clientMood ?? "unknown"} teamMood=${
          updatedProject?.teamMood ?? "unknown"
        }`,
      );

      processedProjects++;
    } catch (error) {
      failedProjects++;
      console.error(
        `   ❌ ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  console.log("✅ Done");
  console.log(
    JSON.stringify(
      {
        date: dateKey,
        totalProjects: projects.length,
        processedProjects,
        failedProjects,
        createdSignals,
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();

  if (failedProjects > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("❌ Daily project signals failed");
  console.error(error);
  process.exit(1);
});
