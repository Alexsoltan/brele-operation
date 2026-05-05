import { PrismaPg } from "@prisma/adapter-pg";

const { PrismaClient } = require("../generated/prisma/client");

const globalForPrisma = globalThis as unknown as {
  prisma?: any;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const requiredDelegates = ["mailAccount", "inboundMeetingDraft"];

function hasRequiredDelegates(client: any) {
  return requiredDelegates.every((delegate) => client?.[delegate]);
}

if (globalForPrisma.prisma && !hasRequiredDelegates(globalForPrisma.prisma)) {
  globalForPrisma.prisma = undefined;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
