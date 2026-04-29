import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  type UserRole,
} from "../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.meeting.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workspace.deleteMany();

  const workspace = await prisma.workspace.create({
    data: {
      name: "Brele",
      slug: "brele",
    },
  });

  await prisma.user.create({
    data: {
      workspaceId: workspace.id,
      email: "admin@brele.local",
      name: "Admin",
      role: "ADMIN" as UserRole,
    },
  });

  console.log("Seed completed");
  console.log(`Workspace: ${workspace.name}`);
  console.log("Admin: admin@brele.local");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });