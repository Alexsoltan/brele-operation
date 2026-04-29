import { prisma } from "@/lib/prisma";

type UserRole = "ADMIN" | "MANAGER" | "ANALYST";

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

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await getCurrentUser();

  if (!allowedRoles.includes(user.role as UserRole)) {
    throw new Error("Forbidden");
  }

  return user;
}

export async function requireCanRead() {
  return requireRole(["ADMIN", "MANAGER", "ANALYST"]);
}

export async function requireCanManageProjects() {
  return requireRole(["ADMIN", "MANAGER"]);
}

export async function requireCanManageMeetings() {
  return requireRole(["ADMIN", "MANAGER"]);
}

export async function requireCanManageUsers() {
  return requireRole(["ADMIN"]);
}