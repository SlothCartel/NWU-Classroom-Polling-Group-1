import { useEffect, useMemo, useState } from "react";
import {
  createPoll,
  listPolls,
  startPoll,
  closePoll,
  updatePoll,
  openPoll,
  listLobby,
  kickFromLobby,
} from "@/lib/api";
import type { Poll, QuizQuestion, ChoiceLabel } from "@/lib/types";

const LETTERS: ChoiceLabel[] = ["A", "B", "C", "D"];

function blankQuestion(): QuizQuestion {
  return {
    text: "",
    options: LETTERS.map((l) => ({ label: l, text: "" })),
    correctIndex: 0,
  };
}

export default function DashboardPage() {
  const [polls, setPolls] = useState<Poll[]>([]);

  // Left card (Create a new poll)
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    Array.from({ length: 5 }, blankQuestion),
  );
  const [minutes, setMinutes] = useState<number>(5);
  const [securityCode, setSecurityCode] = useState<string>("");

  // Right card (per-poll quick edits: timer + code)
  const [edits, setEdits] =
    useState<Record<string, { minutes: number; securityCode: string }>>({});

  // Lobby state
  const [lobbyFor, setLobbyFor] = useState<Poll | null>(null);
  const [lobbyList, setLobbyList] = useState<string[]>([]);

  async function refresh() {
    const data = await listPolls();
    setPolls(data);
    const next: Record<string, { minutes: number; securityCode: string }> = {};
    data.forEach((p) => {
      next[p.id] = {
        minutes: Math.max(1, Math.round(p.timerSeconds / 60)),
        securityCode: p.securityCode ?? "",
      };
    });
    setEdits(next);
  }
  useEffect(() => {
    void refresh();
  }, []);

  // ---- lobby: poll attendees every ~1.5s while modal is open
  useEffect(() => {
    if (!lobbyFor) return;
    const pollId = lobbyFor.id;
    let stopped = false;
    let timer: number | undefined;

    async function tick() {
      try {
        const list = await listLobby(pollId);
        if (!stopped) setLobbyList(list);
      } finally {
        if (!stopped) timer = window.setTimeout(tick, 1500);
      }
    }
    tick();

    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [lobbyFor]);

  // ------ create form handlers ------
  function updateQuestionText(i: number, text: string) {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], text };
      return copy;
    });
  }
  function updateOptionText(qIdx: number, oIdx: number, text: string) {
    setQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[qIdx] };
      const opts = [...q.options];
      opts[oIdx] = { ...opts[oIdx], text };
      q.options = opts;
      copy[qIdx] = q;
      return copy;
    });
  }
  function setCorrect(qIdx: number, oIdx: number) {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx] = { ...copy[qIdx], correctIndex: oIdx };
      return copy;
    });
  }

  const canSave = useMemo(() => {
    if (!title.trim()) return false;
    if (minutes < 1) return false;
    for (const q of questions) {
      if (!q.text.trim()) return false;
      if (q.options.some((o) => !o.text.trim())) return false;
      if (q.correctIndex < 0 || q.correctIndex > 3) return false;
    }
    return true;
  }, [title, minutes, questions]);

  async function onCreatePoll(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;

    await createPoll({
      title: title.trim(),
      questions: questions.map((q) => ({
        text: q.text.trim(),
        options: q.options.map((o) => ({ ...o, text: o.text.trim() })),
        correctIndex: q.correctIndex,
      })),
      timerSeconds: Math.max(60, Math.round(minutes) * 60),
      securityCode: securityCode.trim() || undefined,
    });

    setTitle("");
    setQuestions(Array.from({ length: 5 }, blankQuestion));
    setMinutes(5);
    setSecurityCode("");
    await refresh();
  }

  async function savePollSettings(p: Poll) {
    const edit = edits[p.id];
    if (!edit) return;
    await updatePoll(p.id, {
      timerSeconds: Math.max(60, Math.round(edit.minutes) * 60),
      securityCode: edit.securityCode.trim() || undefined,
    });
    await refresh();
  }

  // ---- lobby actions used by buttons on the right card
  async function handleOpenForJoining(p: Poll) {
    await openPoll(p.id); // backend -> status "open"
    await refresh();
    setLobbyFor(p);       // show the modal (and start polling attendees)
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* LEFT: Create a new poll */}
      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-3">Create a new poll</h2>
        <form onSubmit={onCreatePoll} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input
              className="input"
              value={title}
              placeholder="e.g. OS Quiz – Week 3"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Timer (minutes)</label>
              <input
                type="number"
                min={1}
                className="input"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Security code (optional)</label>
              <input
                className="input"
                placeholder="e.g. NWU2025"
                value={securityCode}
                onChange={(e) => setSecurityCode(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-5">
            {questions.map((q, qi) => (
              <div key={qi} className="border rounded-xl p-4">
                <div className="mb-2 font-medium">Question {qi + 1}</div>
                <input
                  className="input mb-3"
                  placeholder="Enter question text"
                  value={q.text}
                  onChange={(e) => updateQuestionText(qi, e.target.value)}
                />
                <div className="grid sm:grid-cols-2 gap-3">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`q${qi}-correct`}
                        checked={q.correctIndex === oi}
                        onChange={() => setCorrect(qi, oi)}
                        aria-label={`Mark ${opt.label} as correct`}
                      />
                      <span className="w-6 text-center font-semibold">{opt.label}</span>
                      <input
                        className="input flex-1"
                        placeholder={`Option ${opt.label}`}
                        value={opt.text}
                        onChange={(e) => updateOptionText(qi, oi, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  The selected radio marks the correct answer (hidden from students).
                </p>
              </div>
            ))}
          </div>

          <button className="btn-primary" disabled={!canSave}>
            Create poll
          </button>
        </form>
      </section>

      {/* RIGHT: Your polls */}
      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-3">Your polls</h2>
        <div className="space-y-3">
          {polls.length === 0 && <p className="text-gray-500">No polls yet.</p>}

          {polls.map((p) => (
            <div key={p.id} className="border rounded-xl p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.title}</div>
                  <div className="text-sm text-gray-500">
                    Status: {p.status} • Code: {p.joinCode}
                  </div>
                  {p.securityCode && (
                    <div className="text-xs text-gray-600 mt-1">
                      Security code: <span className="font-mono">{p.securityCode}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {(p.status === "draft" || p.status === "closed") && (
                    <button className="btn-secondary" onClick={() => handleOpenForJoining(p)}>
                      Open for joining
                    </button>
                  )}

                  {p.status === "open" && (
                    <button className="btn-secondary" onClick={() => setLobbyFor(p)}>
                      View lobby
                    </button>
                  )}

                  {p.status !== "live" && (
                    <button className="btn-primary" onClick={() => startPoll(p.id).then(refresh)}>
                      Start
                    </button>
                  )}

                  {p.status === "live" && (
                    <button className="btn-secondary" onClick={() => closePoll(p.id).then(refresh)}>
                      Close
                    </button>
                  )}
                </div>
              </div>

              {/* Quick settings for timer + security code */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Timer (minutes)</label>
                  <input
                    type="number"
                    min={1}
                    className="input"
                    value={edits[p.id]?.minutes ?? 5}
                    onChange={(e) =>
                      setEdits((prev) => ({
                        ...prev,
                        [p.id]: {
                          ...(prev[p.id] ?? { minutes: 5, securityCode: "" }),
                          minutes: Number(e.target.value),
                        },
                      }))
                    }
                    onBlur={() => savePollSettings(p)}
                  />
                </div>
                <div>
                  <label className="label">Security code</label>
                  <input
                    className="input"
                    placeholder="Optional"
                    value={edits[p.id]?.securityCode ?? ""}
                    onChange={(e) =>
                      setEdits((prev) => ({
                        ...prev,
                        [p.id]: {
                          ...(prev[p.id] ?? { minutes: 5, securityCode: "" }),
                          securityCode: e.target.value,
                        },
                      }))
                    }
                    onBlur={() => savePollSettings(p)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button className="btn-secondary" onClick={() => savePollSettings(p)}>
                  Save settings
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LOBBY MODAL */}
      {lobbyFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Lobby — {lobbyFor.title}</h3>
              <button className="btn-secondary" onClick={() => setLobbyFor(null)}>
                Close
              </button>
            </div>

            <div className="mb-3 text-sm">
              Share code <span className="font-mono font-semibold">{lobbyFor.joinCode}</span>
              {lobbyFor.securityCode ? (
                <>
                  {" "}
                  • Security: <span className="font-mono">{lobbyFor.securityCode}</span>
                </>
              ) : null}
            </div>

            <div className="border rounded-xl p-3 max-h-64 overflow-auto">
              {lobbyList.length === 0 ? (
                <div className="text-gray-500 text-sm">No students yet…</div>
              ) : (
                <ul className="space-y-1">
                  {lobbyList.map((s) => (
                    <li key={s} className="flex items-center justify-between">
                      <span className="font-mono">{s}</span>
                      <button
                        className="btn-secondary"
                        onClick={() =>
                          kickFromLobby(lobbyFor.id, s).then(() =>
                            listLobby(lobbyFor.id).then(setLobbyList),
                          )
                        }
                      >
                        Kick
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-3 text-sm text-gray-600">{lobbyList.length} joined</div>
          </div>
        </div>
      )}
    </div>
  );
}
