import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import { recalculateProjectHealth } from "../src/lib/recalculate-project-health";

async function main() {
  const projects = await prisma.project.findMany({
    where: {
      deletedAt: null,
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

  console.log(`Found ${projects.length} projects`);

  for (const project of projects) {
    const updatedProject = await recalculateProjectHealth(
      project.id,
      project.workspaceId,
    );

    if (!updatedProject) {
      console.log(`Skipped: ${project.name}`);
      continue;
    }

    console.log(
      `Updated: ${project.name} | score=${updatedProject.healthScore} | trend=${updatedProject.healthTrend} | label=${updatedProject.healthLabel}`,
    );
  }
}

main()
  .catch((error) => {
    console.error("Failed to recalculate project health:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });