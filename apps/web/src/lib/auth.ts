export type Role = "student" | "lecturer";

const TOKEN_KEY = "authToken";
const ROLE_KEY  = "authRole";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

export const getRole = () => localStorage.getItem(ROLE_KEY) as Role | null;
export const setRole = (r: Role | null) =>
  r ? localStorage.setItem(ROLE_KEY, r) : localStorage.removeItem(ROLE_KEY);

// --- NEW: remember the student's number so we can fetch history
const STUDENT_NO_KEY = "studentNumber";            // NEW
export const getStudentNumber = () => localStorage.getItem(STUDENT_NO_KEY); // NEW
export const setStudentNumber = (n: string | null) => {                      // NEW
  if (n && n.trim()) localStorage.setItem(STUDENT_NO_KEY, n.trim());
  else localStorage.removeItem(STUDENT_NO_KEY);
};

export const clearAuth = () => { setToken(null); setRole(null); /* keep student no? up to you */ };
