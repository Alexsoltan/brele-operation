export type UserRole = "ADMIN" | "MANAGER" | "ANALYST";

export function canManageProjects(role?: UserRole) {
  return role === "ADMIN" || role === "MANAGER";
}

export function canManageMeetings(role?: UserRole) {
  return role === "ADMIN" || role === "MANAGER";
}

export function canManageUsers(role?: UserRole) {
  return role === "ADMIN";
}