import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const user = await prisma.user.findUnique({
    where: {
      email: "admin@brele.local",
    },
    include: {
      workspace: true,
    },
  });

  if (!user || !user.workspaceId) {
    throw new Error("Dev user or workspace not found. Run prisma seed.");
  }

  return user;
}

export async function getCurrentWorkspaceId() {
  const user = await getCurrentUser();

  return user.workspaceId;
}