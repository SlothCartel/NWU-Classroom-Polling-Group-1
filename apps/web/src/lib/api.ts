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
    questions: p.questions.map((q) => ({
      text: q.question_text,
      correctIndex: q.correctIndex ?? 0,
      options: q.options
        .sort((a, b) => a.optionIndex - b.optionIndex)
        .map((o) => ({
          label: (LABELS[o.optionIndex] ?? "A") as ChoiceLabel,
          text: o.option_text,
        })),
    })),
  };
}

function toStudentPoll(p: ServerPoll): StudentPoll {
  return {
    id: String(p.id),
    title: p.title,
    status: p.status as StudentPoll["status"],
    timerSeconds: p.timerSeconds,
    questions: p.questions.map((q, qi) => ({
      id: q.id ?? qi + 1,
      text: q.question_text,
      correctIndex: q.correctIndex ?? -1,
      options: q.options
        .sort((a, b) => a.optionIndex - b.optionIndex)
        .map((o) => ({
          label: (LABELS[o.optionIndex] ?? "A") as ChoiceLabel,
          text: o.option_text,
        })),
    })),
  };
}

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

// ---------- AUTH ----------
export async function studentSignIn(identifier: string, password: string) {
  // Treat identifier as email for backend login (keeps your UI unchanged).
  const r = await http.post<ApiOk<{ user: any; token: string }>>(
    "/auth/student/login",
    { email: identifier.trim(), password },
    false,
  );
  setToken(r.data.token);
  setRole("student");
  return r.data;
}

export async function lecturerSignIn(email: string, password: string) {
  const r = await http.post<ApiOk<{ user: any; token: string }>>(
    "/auth/lecturer/login",
    { email, password },
    false,
  );
  setToken(r.data.token);
  setRole("lecturer");
  return r.data;
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
    ApiOk<{ id: number; name: string; studentNumber: string; joinedAt: string }[]>
  >(`/polls/${id}/lobby`);
  return r.data.map((s) => s.studentNumber);
};

export const kickFromLobby = async (id: string | number, studentNumber: string) =>
  http.del<ApiOk<{ success: true; message: string }>>(`/polls/${id}/lobby/${studentNumber}`);

// ---------- STUDENT participation ----------
export const getPollByCode = async (joinCode: string): Promise<StudentPoll> => {
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

export const submitAnswers = async (p: {
  pollId: string | number;
  answers: number[];
  studentNumber: string;
  securityCode?: string;
}): Promise<SubmitResultUI> => {
  const body = {
    answers: p.answers.map((optIndex, i) => ({
      questionId: lastQuestionIds[i] ?? i + 1,
      optionIndex: optIndex,
    })),
  };
  await http.post<ApiOk<any>>(`/polls/${p.pollId}/submit`, body);

  const poll = lastStudentPoll;
  const total = poll?.questions.length ?? p.answers.length;
  const feedback =
    poll?.questions.map((q, i) => ({
      qIndex: i,
      question: q.text,
      options: q.options,
      chosenIndex: p.answers[i],
      correctIndex: q.correctIndex ?? -1,
      correct: (q.correctIndex ?? -1) === p.answers[i],
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
    // shape matches your StatsPage needs
  });

  return { attendees, perQuestion };
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
