export type Role = "student" | "lecturer";

const TOKEN_KEY = "authToken";
const ROLE_KEY  = "authRole";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

export const getRole = () => localStorage.getItem(ROLE_KEY) as Role | null;
export const setRole = (r: Role | null) =>
  r ? localStorage.setItem(ROLE_KEY, r) : localStorage.removeItem(ROLE_KEY);

export const clearAuth = () => { setToken(null); setRole(null); };