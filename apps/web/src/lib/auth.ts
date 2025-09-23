export type Role = "student" | "lecturer" | null;

const KEY = "auth_role";

export function getRole(): Role {
  const v = localStorage.getItem(KEY);
  return v === "student" || v === "lecturer" ? v : null;
}

export function setRole(role: Exclude<Role, null>) {
  localStorage.setItem(KEY, role);
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}