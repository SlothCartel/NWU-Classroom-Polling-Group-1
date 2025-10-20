// apps/web/src/lib/api.ts (top of file – replace the mapping helpers)

import { http } from "./http";
import { setToken, setRole } from "./auth";
import type {
  ApiOk,
  ServerPoll,
  ServerStats,
  Poll,
  QuizQuestion,
  ChoiceLabel,
  StudentPoll,
  StoredSubmission,
  SubmitResultUI,
} from "./types";

const LABELS = ["A", "B", "C", "D"] as const;

// --- small normalizers so we tolerate both server shapes ---
const getQText = (q: any) => q?.text ?? q?.question_text ?? "";
const getOptIndex = (o: any) =>
  typeof o?.optionIndex === "number" ? o.optionIndex :
  typeof o?.index === "number"      ? o.index      : 0;
const getOptText = (o: any) => o?.option_text ?? o?.text ?? "";

// ---------- map server → UI ----------
function toUIPoll(p: ServerPoll): Poll {
  return {
    id: String(p.id),
    title: p.title,
    description: p.description ?? null,
    joinCode: p.joinCode,
    status: p.status as Poll["status"],
    timerSeconds: p.timerSeconds,
    securityCode: p.securityCode ?? null,
    createdAt: p.createdAt ?? undefined,
    questions: (p.questions || []).map((q: any) => ({
      text: getQText(q),
      correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
      options: (q.options || [])
        .slice()
        .sort((a: any, b: any) => getOptIndex(a) - getOptIndex(b))
        .map((o: any) => {
          const idx = getOptIndex(o);
          return {
            label: (LABELS[idx] ?? "A") as ChoiceLabel,
            text: getOptText(o),
          };
        }),
    })),
  };
}

function toStudentPoll(p: ServerPoll): StudentPoll {
  return {
    id: String(p.id),
    title: p.title,
    status: p.status as StudentPoll["status"],
    timerSeconds: p.timerSeconds,
    questions: (p.questions || []).map((q: any, qi: number) => ({
      id: q.id ?? qi + 1,
      text: getQText(q),
      correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : -1,
      options: (q.options || [])
        .slice()
        .sort((a: any, b: any) => getOptIndex(a) - getOptIndex(b))
        .map((o: any) => {
          const idx = getOptIndex(o);
          return {
            label: (LABELS[idx] ?? "A") as ChoiceLabel,
            text: getOptText(o),
          };
        }),
    })),
  };
}

// keep as-is – backend still expects { text, index }
function toServerQuestions(qs: QuizQuestion[]) {
  return qs.map((q) => ({
    text: q.text,
    correctIndex: q.correctIndex,
    options: q.options.map((o, idx) => ({ text: o.text, index: idx })),
  }));
}

let lastQuestionIds: number[] = [];
let lastStudentPoll: StudentPoll | null = null;
function remember(p: StudentPoll) {
  lastStudentPoll = p;
  lastQuestionIds = p.questions.map((q, i) => q.id ?? i + 1);
}

// Small helper: treat “pasted token” flows as sign-in
function looksLikeJwt(s: string) {
  return typeof s === "string" && s.split(".").length === 3;
}

// ---------- AUTH (frontend-only) ----------
/**
 * Frontend-only sign-in:
 * - If `password` looks like a JWT (three dot-separated parts), we store it and set the role.
 * - Otherwise we throw, because the backend has no /auth/* routes.
 * (This keeps your UI flow intact without changing the backend.)
 */
// ---------- AUTH (real backend) ----------
/**
 * Student sign-in:
 * Your backend uses validateSignin; for students, we’ll prefer studentNumber.
 * If the user typed an email instead of a number, we’ll send email.
 */
export async function studentSignIn(identifier: string, password: string) {
  const trimmed = identifier.trim();
  const email = trimmed.includes("@") ? trimmed : `student${trimmed}@example.com`;

  const r = await http.post<ApiOk<{ user: any; token: string }>>(
    "/auth/student/login",
    { email, password },
    false
  );

  const { token, user } = (r as any).data || {};
  if (!token) throw new Error("No token returned by /auth/student/login");

  setToken(token);
  setRole("student");
  return { user, token };
}

/** Lecturer sign-in */
export async function lecturerSignIn(email: string, password: string) {
  const r = await http.post<ApiOk<{ user: any; token: string }>>(
    "/auth/lecturer/login",
    { email: email.trim(), password },
    false
  );

  const { token, user } = (r as any).data || {};
  if (!token) throw new Error("No token returned by /auth/lecturer/login");

  setToken(token);
  setRole("lecturer");
  return { user, token };
}
// ---------- SIGN UP (no auto-login; redirect back to /login from pages) ----------
export async function studentSignUp(p: {
  name: string;
  studentNumber: string;
  email: string;
  password: string;
}) {
  // hits POST /api/auth/student/signup
  const r = await http.post<ApiOk<{ user: any; token: string }>>(
    "/auth/student/signup",
    p,
    false
  );
  // We intentionally do NOT call setToken / setRole here.
  // The page will redirect to /login so the user signs in explicitly.
  return r.data; // { user, token }
}

export async function lecturerSignUp(p: {
  name: string;
  email: string;
  password: string;
}) {
  // hits POST /api/auth/lecturer/signup
  const r = await http.post<ApiOk<{ user: any; token: string }>>(
    "/auth/lecturer/signup",
    p,
    false
  );
  // Also no auto-login—page will send user back to /login.
  return r.data; // { user, token }
}



// ---------- POLLS (lecturer) ----------
export const listPolls = async (): Promise<Poll[]> => {
  const r = await http.get<ApiOk<ServerPoll[]>>("/polls");
  return r.data.map(toUIPoll);
};

export const createPoll = async (p: {
  title: string;
  questions: QuizQuestion[];
  timerSeconds: number;
  securityCode?: string;
}): Promise<Poll> => {
  const r = await http.post<ApiOk<ServerPoll>>("/polls", {
    title: p.title,
    questions: toServerQuestions(p.questions),
    timerSeconds: p.timerSeconds,
    securityCode: p.securityCode,
  });
  return toUIPoll(r.data);
};

export const deletePoll = async (id: string | number) => {
  await http.del<ApiOk<{ message: string }>>(`/polls/${id}`);
};

export const openPoll  = async (id: string | number) => toUIPoll((await http.post<ApiOk<ServerPoll>>(`/polls/${id}/open`)).data);
export const startPoll = async (id: string | number) => toUIPoll((await http.post<ApiOk<ServerPoll>>(`/polls/${id}/start`)).data);
export const closePoll = async (id: string | number) => toUIPoll((await http.post<ApiOk<ServerPoll>>(`/polls/${id}/close`)).data);

// Backend PUT not implemented (501), but we expose it to keep page code intact.
export async function updatePoll(
  id: string | number,
  payload:
    | { title: string; questions: QuizQuestion[] }
    | { timerSeconds: number; securityCode?: string },
) {
  const body =
    "questions" in payload
      ? { title: payload.title, questions: toServerQuestions(payload.questions) }
      : payload;
  await http.put<ApiOk<ServerPoll>>(`/polls/${id}`, body); // expect 501 per backend
}

export const getPollById = async (id: string | number) =>
  toUIPoll((await http.get<ApiOk<ServerPoll>>(`/polls/${id}`)).data);

// ---------- LOBBY ----------
export const listLobby = async (id: string | number): Promise<string[]> => {
  const r = await http.get<
    ApiOk<
      | string[] // e.g. ["37613480"]
      | { id: number; name?: string | null; studentNumber?: string }[]
    >
  >(`/polls/${id}/lobby`);

  // Unwrap the payload (backend sends { success, data })
  const payload: any = (r as any).data?.data ?? r.data;

  // If it's already an array of strings → return as-is
  if (Array.isArray(payload) && payload.every((v) => typeof v === "string")) {
    return payload as string[];
  }

  // Otherwise map objects to studentNumber
  return (payload as any[])
    .map(
      (s) =>
        s?.studentNumber ??
        s?.student_number ??
        s?.studentnumber ??
        s?.studentNo ??
        s?.student_no ??
        ""
    )
    .filter((v: any) => typeof v === "string" && v.trim().length > 0);
};

export const kickFromLobby = async (id: string | number, studentNumber: string) =>
  http.del<ApiOk<{ success: true; message: string }>>(`/polls/${id}/lobby/${studentNumber}`);

// ---------- STUDENT participation ----------
export const getPollByCode = async (joinCode: string): Promise<StudentPoll> => {
  // public route (no auth required)
  const r = await http.get<ApiOk<ServerPoll>>(`/polls/code/${joinCode}`, false);
  const sp = toStudentPoll(r.data);
  remember(sp);
  return sp;
};

export const studentJoin = async (p: {
  joinCode: string;
  studentNumber: string;
  securityCode?: string;
}): Promise<StudentPoll> => {
  // public route (no auth required)
  const r = await http.post<ApiOk<ServerPoll>>("/polls/join", p, false);
  const sp = toStudentPoll(r.data);
  remember(sp);
  return sp;
};

export const recordLiveChoice = async (
  pollId: string | number,
  _studentNumber: string,
  qIndex: number,
  optionIndex: number,
) => {
  const questionId = lastQuestionIds[qIndex] ?? qIndex + 1;
  await http.post<ApiOk<{ success: true; message?: string }>>(
    `/polls/${pollId}/choices`,
    { questionId, optionIndex },
  );
};

// ---------- STUDENT participation ----------
export const submitAnswers = async (p: {
  pollId: string | number;
  answers: number[];          // may be empty if lecturer ends instantly
  studentNumber: string;
  securityCode?: string;
}): Promise<SubmitResultUI> => {
  // If the UI hasn't populated `answers` yet (rare race when lecturer ends),
  // create a full-length array of -1 (unanswered) so we *always* send something.
  const safeAnswers =
    Array.isArray(p.answers) && p.answers.length > 0
      ? p.answers
      : Array.from({ length: lastQuestionIds.length }, () => -1);

  const body = {
    studentNumber: p.studentNumber,
    securityCode: p.securityCode ?? null,
    answers: safeAnswers.map((optIndex, i) => ({
      questionId: lastQuestionIds[i] ?? i + 1,
      optionIndex: optIndex, // may be -1 (unanswered) — backend handles it
    })),
  };

  await http.post<ApiOk<any>>(`/polls/${p.pollId}/submit`, body);

  // Build client-side feedback using the last poll snapshot we remembered
  const poll = lastStudentPoll;
  const total = poll?.questions.length ?? safeAnswers.length;
  const feedback =
    poll?.questions.map((q, i) => ({
      qIndex: i,
      question: q.text,
      options: q.options,
      chosenIndex: safeAnswers[i],
      correctIndex: q.correctIndex ?? -1,
      correct: (q.correctIndex ?? -1) === safeAnswers[i],
    })) ?? [];
  const score = feedback.filter((f) => f.correct).length;

  return { score, total, feedback };
};


// ---------- ANALYTICS ----------
export const getPollStats = async (id: string | number) => {
  const [stats, lobby] = await Promise.all([
    http.get<ApiOk<ServerStats>>(`/polls/${id}/stats`),
    http.get<
      ApiOk<{ id: number; name: string; studentNumber: string; joinedAt: string }[]>
    >(`/polls/${id}/lobby`),
  ]);

  const attendees = lobby.data.map((s) => s.studentNumber);
  const perQuestion = stats.data.questions.map((q, idx) => {
    const correct = q.correctAnswers;
    const incorrect = Math.max(0, q.totalAnswers - q.correctAnswers);
    const notAnswered = Math.max(0, attendees.length - q.totalAnswers);
    return { qIndex: idx, text: q.questionText, correct, incorrect, notAnswered };
  });

  return { attendees, perQuestion };
};

// Export poll data as CSV
export const exportPollCsv = async (id: string | number): Promise<Blob> => {
  return http.blob(`/polls/${id}/export?format=csv`);
};

// ---------- STUDENT history ----------
export const listStudentSubmissions = async (studentNumber: string) => {
  const r = await http.get<ApiOk<StoredSubmission[]>>(
    `/students/${encodeURIComponent(studentNumber)}/submissions`,
  );
  return r.data;
};

export const deleteStudentSubmission = async (pollId: string, studentNumber: string) =>
  http.del<ApiOk<{ success: true; message: string }>>(
    `/students/${encodeURIComponent(studentNumber)}/submissions/${encodeURIComponent(pollId)}`,
  );
