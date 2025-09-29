// src/lib/api.ts
// MOCK API using localStorage, with lobby + grading/feedback + stats + student history

import type {
  Poll,
  QuizQuestion,
  StudentPoll,
  SubmissionFeedback,
  SubmitResult,
  StoredSubmission,
} from "./types";

const LS_POLLS = "mock_polls_v1";
const LS_LOBBY = "mock_lobbies_v1";
const LS_SUBMISSIONS = "mock_submissions_v1"; // studentNumber -> StoredSubmission[]
const LS_LIVE = "mock_live_responses_v1"; // pollId -> { [studentNumber]: number[] }

type Lobby = Record<string, string[]>; // pollId -> [studentNumber]
type StoredByStudent = Record<string, StoredSubmission[]>; // studentNumber -> submissions[]
type LiveMap = Record<string, Record<string, number[]>>; // pollId -> student -> answers[]

/* ---------------- helpers ---------------- */
function loadPolls(): Poll[] {
  try {
    const raw = localStorage.getItem(LS_POLLS);
    return raw ? (JSON.parse(raw) as Poll[]) : [];
  } catch {
    return [];
  }
}
function savePolls(p: Poll[]) {
  localStorage.setItem(LS_POLLS, JSON.stringify(p));
}
function loadLobby(): Lobby {
  try {
    const raw = localStorage.getItem(LS_LOBBY);
    return raw ? (JSON.parse(raw) as Lobby) : {};
  } catch {
    return {};
  }
}
function saveLobby(l: Lobby) {
  localStorage.setItem(LS_LOBBY, JSON.stringify(l));
}
function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function genJoinCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function loadAllSubmissions(): StoredByStudent {
  try {
    const raw = localStorage.getItem(LS_SUBMISSIONS);
    return raw ? (JSON.parse(raw) as StoredByStudent) : {};
  } catch {
    return {};
  }
}
function saveAllSubmissions(obj: StoredByStudent) {
  localStorage.setItem(LS_SUBMISSIONS, JSON.stringify(obj));
}

function loadLive(): LiveMap {
  try {
    const raw = localStorage.getItem(LS_LIVE);
    return raw ? (JSON.parse(raw) as LiveMap) : {};
  } catch {
    return {};
  }
}
function saveLive(obj: LiveMap) {
  localStorage.setItem(LS_LIVE, JSON.stringify(obj));
}

/* ---------------- lecturer/admin ---------------- */
export async function listPolls(): Promise<Poll[]> {
  return loadPolls();
}

export async function createPoll(payload: {
  title: string;
  questions: QuizQuestion[];
  timerSeconds: number;
  securityCode?: string;
}): Promise<Poll> {
  const polls = loadPolls();
  const poll: Poll = {
    id: genId(),
    joinCode: genJoinCode(),
    title: payload.title,
    status: "draft",
    questions: payload.questions,
    timerSeconds: payload.timerSeconds,
    securityCode: payload.securityCode,
  };
  polls.unshift(poll);
  savePolls(polls);
  return poll;
}

export async function updatePoll(
  id: string,
  patch: Partial<Pick<Poll, "title" | "questions" | "timerSeconds" | "securityCode" | "status">>,
): Promise<void> {
  const polls = loadPolls();
  const i = polls.findIndex((p) => p.id === id);
  if (i >= 0) {
    polls[i] = { ...polls[i], ...patch };
    savePolls(polls);
  }
}

export async function deletePoll(id: string): Promise<void> {
  const polls = loadPolls().filter((p) => p.id !== id);
  savePolls(polls);
  const lobby = loadLobby();
  delete lobby[id];
  saveLobby(lobby);

  // Also delete any stored submissions for this poll
  const all = loadAllSubmissions();
  Object.keys(all).forEach((stu) => {
    all[stu] = all[stu].filter((s) => s.pollId !== id);
  });
  saveAllSubmissions(all);

  // Remove live responses too
  const live = loadLive();
  delete live[id];
  saveLive(live);
}

export async function openPoll(id: string): Promise<void> {
  await updatePoll(id, { status: "open" });
  const lobby = loadLobby();
  if (!lobby[id]) lobby[id] = [];
  saveLobby(lobby);
}

export async function startPoll(id: string): Promise<void> {
  await updatePoll(id, { status: "live" });
}

export async function closePoll(id: string): Promise<void> {
  // When lecturer ends the poll, move to closed.
  await updatePoll(id, { status: "closed" });
}

/* ------- lobby (waiting room) controls for lecturer ------- */
export async function listLobby(pollId: string): Promise<string[]> {
  const lobby = loadLobby();
  return lobby[pollId] ?? [];
}
export async function kickFromLobby(pollId: string, studentNumber: string): Promise<void> {
  const lobby = loadLobby();
  lobby[pollId] = (lobby[pollId] ?? []).filter((s) => s !== studentNumber);
  saveLobby(lobby);

  // Also clear any live picks for that student (keeps stats clean)
  const live = loadLive();
  if (live[pollId]) {
    delete live[pollId][studentNumber];
    saveLive(live);
  }
}

/* ---------------- student-facing ---------------- */
export async function getPollByCode(joinCode: string): Promise<StudentPoll> {
  const polls = loadPolls();
  const p = polls.find((x) => x.joinCode.toUpperCase() === joinCode.toUpperCase());
  if (!p) throw new Error("Poll not found");
  if (!(p.status === "open" || p.status === "live")) {
    throw new Error("Poll is not accepting joins");
  }
  return {
    id: p.id,
    joinCode: p.joinCode,
    title: p.title,
    status: p.status as "open" | "live",
    timerSeconds: p.timerSeconds,
    questions: p.questions.map((q) => ({ text: q.text, options: q.options })),
  };
}

/** Register a student (attendance) */
export async function studentJoin(params: {
  joinCode: string;
  studentNumber: string;
  securityCode?: string;
}): Promise<{ pollId: string; status: "open" | "live" }> {
  const polls = loadPolls();
  const p = polls.find((x) => x.joinCode.toUpperCase() === params.joinCode.toUpperCase());
  if (!p) throw new Error("Poll not found");
  if (p.securityCode && p.securityCode !== params.securityCode)
    throw new Error("Invalid security code");
  if (!(p.status === "open" || p.status === "live")) throw new Error("Poll is not accepting joins");

  // ✅ Always track attendance (even when poll is already live)
  const lobby = loadLobby();
  const list = lobby[p.id] ?? [];
  if (!list.includes(params.studentNumber)) list.push(params.studentNumber);
  lobby[p.id] = list;
  saveLobby(lobby);

  return { pollId: p.id, status: p.status as "open" | "live" };
}

/** Record a live (in-progress) choice so stats can reflect picks before submission. */
export async function recordLiveChoice(
  pollId: string,
  studentNumber: string,
  qIndex: number,
  chosenIndex: number,
): Promise<void> {
  const live = loadLive();
  if (!live[pollId]) live[pollId] = {};
  const arr = Array.isArray(live[pollId][studentNumber]) ? live[pollId][studentNumber] : [];
  const next = [...arr];
  next[qIndex] = chosenIndex;
  live[pollId][studentNumber] = next;
  saveLive(live);
}

/** Grade & return feedback + persist to student history
 *  - Accept when poll is 'live' **or** 'closed'
 *  - Treat unanswered as -1 (incorrect)
 *  - Clear live picks for the student once submitted (to avoid double counting)
 */
export async function submitAnswers(params: {
  pollId: string;
  answers: number[];
  studentNumber: string;
  securityCode?: string;
}): Promise<SubmitResult> {
  const polls = loadPolls();
  const p = polls.find((x) => x.id === params.pollId);
  if (!p) throw new Error("Poll not found");
  if (p.securityCode && p.securityCode !== params.securityCode)
    throw new Error("Invalid security code");
  if (!(p.status === "live" || p.status === "closed")) throw new Error("Poll is not live");

  const feedback: SubmissionFeedback[] = p.questions.map((q, i) => {
    const chosenIndex = Number.isInteger(params.answers[i]) ? params.answers[i] : -1;
    const correct = chosenIndex === q.correctIndex;
    return {
      qIndex: i,
      question: q.text,
      chosenIndex,
      correctIndex: q.correctIndex,
      correct,
      options: q.options,
    };
  });

  const score = feedback.filter((f) => f.correct).length;
  const result: SubmitResult = { score, total: p.questions.length, feedback };

  // Persist to local "history" per student so StudentPage can load it
  const all = loadAllSubmissions();
  const list = all[params.studentNumber] ?? [];
  const entry: StoredSubmission = {
    pollId: p.id,
    joinCode: p.joinCode,
    title: p.title,
    submittedAt: Date.now(),
    score,
    total: p.questions.length,
    feedback,
    studentNumber: params.studentNumber,
  };
  const next = list.filter((s) => s.pollId !== entry.pollId);
  next.push(entry);
  next.sort((a, b) => b.submittedAt - a.submittedAt);
  all[params.studentNumber] = next;
  saveAllSubmissions(all);

  // ✅ Clear live picks for this student (prevents double counting in stats)
  const live = loadLive();
  if (live[p.id]) {
    delete live[p.id][params.studentNumber];
    saveLive(live);
  }

  return result;
}

/* ---------------- student results history (used by StudentPage) ---------------- */
export async function listStudentSubmissions(studentNumber: string): Promise<StoredSubmission[]> {
  const all = loadAllSubmissions();
  const arr = all[studentNumber] ?? [];
  return [...arr].sort((a, b) => b.submittedAt - a.submittedAt);
}

export async function deleteStudentSubmission(
  pollId: string,
  studentNumber: string,
): Promise<void> {
  const all = loadAllSubmissions();
  const arr = all[studentNumber] ?? [];
  all[studentNumber] = arr.filter((s) => s.pollId !== pollId);
  saveAllSubmissions(all);
}

/* ---------------- helpers for Stats page ---------------- */
export async function getPollById(pollId: string): Promise<Poll> {
  const polls = loadPolls();
  const p = polls.find((x) => x.id === pollId);
  if (!p) throw new Error("Poll not found");
  return p;
}

/** Aggregate per-question correct/incorrect/notAnswered + attendees for a poll
 *  - Uses submitted results
 *  - Plus live in-progress choices for students who haven't submitted yet
 *  - Attendance = union(lobby attendees, live responders, submitted students)
 */
export async function getPollStats(pollId: string): Promise<{
  pollId: string;
  title: string;
  attendees: string[];
  perQuestion: {
    qIndex: number;
    text: string;
    correct: number;
    incorrect: number;
    notAnswered: number;
  }[];
}> {
  const poll = await getPollById(pollId);

  const byStudent = loadAllSubmissions();
  const live = loadLive();
  const lobby = loadLobby();

  const submittedBy = new Set<string>();
  const attendees = new Set<string>(lobby[pollId] ?? []);

  const perQuestion = poll.questions.map((q, idx) => ({
    qIndex: idx,
    text: q.text,
    correct: 0,
    incorrect: 0,
    notAnswered: 0,
  }));

  // 1) Tally submitted results
  Object.entries(byStudent).forEach(([stu, subs]) => {
    (subs as StoredSubmission[]).forEach((s) => {
      if (s.pollId !== pollId) return;
      submittedBy.add(stu);
      attendees.add(stu);
      s.feedback.forEach((f) => {
        const tgt = perQuestion[f.qIndex];
        if (!tgt) return;
        if (f.chosenIndex == null || f.chosenIndex < 0) tgt.notAnswered += 1;
        else if (f.correct) tgt.correct += 1;
        else tgt.incorrect += 1;
      });
    });
  });

  // 2) Tally live in-progress picks for students who haven't submitted
  const liveForPoll = live[pollId] ?? {};
  Object.entries(liveForPoll).forEach(([stu, answers]) => {
    attendees.add(stu);
    if (submittedBy.has(stu)) return; // already counted via submission
    poll.questions.forEach((q, idx) => {
      const choice = answers[idx];
      const tgt = perQuestion[idx];
      if (!tgt) return;
      if (Number.isInteger(choice)) {
        if (choice === q.correctIndex) tgt.correct += 1;
        else tgt.incorrect += 1;
      } else {
        tgt.notAnswered += 1;
      }
    });
  });

  return {
    pollId,
    title: poll.title,
    attendees: Array.from(attendees),
    perQuestion,
  };
}
