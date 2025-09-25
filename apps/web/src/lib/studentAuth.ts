// src/lib/studentAuth.ts
// Simple localStorage-based student auth (demo only)

import { setRole, clearAuth, getRole } from "@/lib/auth";

const LS_STUDENT_DB = "students_db_v1"; // [{ number, passwordHash }]
const LS_STUDENT_CURRENT = "student_current_v1"; // current logged-in student number

type Student = { number: string; passwordHash: string };

function loadDB(): Student[] {
  try {
    return JSON.parse(localStorage.getItem(LS_STUDENT_DB) || "[]") as Student[];
  } catch {
    return [];
  }
}
function saveDB(db: Student[]) {
  localStorage.setItem(LS_STUDENT_DB, JSON.stringify(db));
}

function hash(pw: string) {
  // demo hash (DO NOT use in prod)
  return btoa(encodeURIComponent(pw)).split("").reverse().join("");
}

export function getCurrentStudentNumber(): string | null {
  return localStorage.getItem(LS_STUDENT_CURRENT);
}

export function isStudentAuthed(): boolean {
  return getRole() === "student" && !!getCurrentStudentNumber();
}

export async function studentSignUp(number: string, password: string): Promise<void> {
  const n = number.trim();
  const p = password.trim();
  if (!n || !p) throw new Error("Student number and password are required");

  const db = loadDB();
  if (db.some((s) => s.number === n)) throw new Error("This student number already has an account");

  db.push({ number: n, passwordHash: hash(p) });
  saveDB(db);

  localStorage.setItem(LS_STUDENT_CURRENT, n);
  setRole("student");
}

export async function studentSignIn(number: string, password: string): Promise<void> {
  const n = number.trim();
  const p = password.trim();
  if (!n || !p) throw new Error("Student number and password are required");

  const db = loadDB();
  const row = db.find((s) => s.number === n);
  if (!row || row.passwordHash !== hash(p)) throw new Error("Invalid number or password");

  localStorage.setItem(LS_STUDENT_CURRENT, n);
  setRole("student");
}

export function studentSignOut() {
  localStorage.removeItem(LS_STUDENT_CURRENT);
  clearAuth();
}
export function getStudentNumber(): string {
  return getCurrentStudentNumber() || "";
}
