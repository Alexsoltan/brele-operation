import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth-session";

type UserRole = "ADMIN" | "MANAGER" | "ANALYST";

export async function getCurrentUser() {
  const userId = getSessionUserId();

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
    },
    include: {
      workspace: true,
    },
  });

  if (!user || !user.workspaceId || !user.workspace) {
    return null;
  }

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function getCurrentWorkspaceId() {
  const user = await requireUser();

  return user.workspaceId;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireUser();

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