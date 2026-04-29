import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  type Mood,
  type Risk,
  type ProjectStatus,
  type MeetingAnalysisStatus,
} from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const projects = [
  {
    id: "freeport",
    slug: "freeport",
    name: "Freeport",
    client: "ООО «Супертехнологии»",
    status: "active" as ProjectStatus,
    clientMood: "neutral" as Mood,
    teamMood: "neutral" as Mood,
    risk: "low" as Risk,
  },
  {
    id: "alfa-mobile-app",
    slug: "alfa-mobile-app",
    name: "Альфа-Банк — Mobile App",
    client: "Альфа-Банк",
    status: "active" as ProjectStatus,
    clientMood: "good" as Mood,
    teamMood: "good" as Mood,
    risk: "low" as Risk,
  },
  {
    id: "beta-crm",
    slug: "beta-crm",
    name: "Beta Group — CRM",
    client: "Beta Group",
    status: "active" as ProjectStatus,
    clientMood: "neutral" as Mood,
    teamMood: "neutral" as Mood,
    risk: "medium" as Risk,
  },
  {
    id: "gamma-website",
    slug: "gamma-website",
    name: "Gamma — Website",
    client: "Gamma",
    status: "active" as ProjectStatus,
    clientMood: "bad" as Mood,
    teamMood: "neutral" as Mood,
    risk: "high" as Risk,
  },
];

const meetings = [
  {
    id: "meeting-1",
    projectId: "alfa-mobile-app",
    title: "Демо",
    date: new Date("2026-04-24"),
    meetingType: "demo",
    transcriptText: "",
    summary:
      "Клиент в целом принял направление дизайна, но попросил отдельно уточнить сроки по мобильной версии и порядок согласования следующих экранов.",
    highlights: [
      "Клиент принял направление дизайна.",
      "Нужно уточнить сроки мобильной версии.",
      "Следующий шаг — согласование следующих экранов.",
    ],
    clientMood: "good" as Mood,
    teamMood: "good" as Mood,
    risk: "low" as Risk,
    analysisStatus: "analyzed" as MeetingAnalysisStatus,
    modelName: "seed",
    analyzedAt: new Date("2026-04-24T12:00:00.000Z"),
  },
];

async function main() {
  for (const project of projects) {
    await prisma.project.upsert({
      where: { id: project.id },
      update: project,
      create: project,
    });
  }

  for (const meeting of meetings) {
    await prisma.meeting.upsert({
      where: { id: meeting.id },
      update: meeting,
      create: meeting,
    });
  }

  console.log("Seed completed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });