import { useEffect, useMemo, useState } from "react";
import { listStudentSubmissions, deleteStudentSubmission } from "@/lib/api";
import type { StoredSubmission } from "@/lib/types";
import { useNavigate } from "react-router-dom";
import { studentSignOut, getStudentNumber } from "@/lib/studentAuth";
import { getRole, setRole } from "@/lib/auth";

function formatDate(ts: number) {
  const d = new Date(ts);
  return (
    d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

export default function StudentPage() {
  const navigate = useNavigate();

  // Ensure role is student
  useEffect(() => {
    if (getRole() !== "student") setRole("student");
  }, []);

  const [studentNumber, setStudentNumber] = useState<string>("");
  const [subs, setSubs] = useState<StoredSubmission[]>([]);
  const [selected, setSelected] = useState<StoredSubmission | null>(null);
  const hasStudent = useMemo(() => studentNumber.trim().length > 0, [studentNumber]);

  // Auto-load results for the signed-in student
  useEffect(() => {
    const n = (typeof getStudentNumber === "function" ? getStudentNumber() : "") || "";
    setStudentNumber(n);
    if (n) {
      listStudentSubmissions(n)
        .then(setSubs)
        .catch(() => setSubs([]));
    }
  }, []);

  async function refresh() {
    if (!hasStudent) return;
    const data = await listStudentSubmissions(studentNumber.trim());
    setSubs(data);
  }

  async function handleDelete(pollId: string) {
    if (!hasStudent) return;
    if (!confirm("Delete this result from your history?")) return;
    await deleteStudentSubmission(pollId, studentNumber.trim());
    await refresh();
  }

  return (
    <div className="min-h-screen bg-purple-700">
      {/* Header */}
      <div className="pt-10 pb-6 text-center">
        <div className="inline-block bg-white rounded-3xl px-8 py-3 shadow-lg">
          <h1 className="text-3xl md:text-4xl font-extrabold text-purple-800 underline decoration-wavy">
            Join
          </h1>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3 text-purple-200">
          <span className="h-px w-40 bg-purple-200/60" />
          <span className="text-2xl">✦✧✦✧✦</span>
          <span className="h-px w-40 bg-purple-200/60" />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-16">
        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-xl p-5 md:p-6">
          {/* top controls (unchanged) */}
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-2">
              <button
                className="btn-primary"
                onClick={() => {
                  setRole("student");
                  navigate("/join");
                }}
              >
                Join a poll
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  studentSignOut();
                  navigate("/student-login");
                }}
              >
                Sign out
              </button>
            </div>

            {/* Small status on the right */}
            {!hasStudent ? (
              <div className="text-sm text-purple-800/80">
                Signed in — past results will appear once your student number is known.
              </div>
            ) : (
              <div className="text-sm text-purple-800/80 font-semibold">
                Student: <span className="font-mono">{studentNumber}</span>
              </div>
            )}
          </div>

          {/* list */}
          <h2 className="text-xl font-semibold text-purple-900 mb-3">Previous polls</h2>

          {!hasStudent ? (
            <div className="text-gray-600 text-sm">
              We don’t have your student number yet. If you just logged in, go ahead and{" "}
              <button
                className="text-purple-700 underline font-medium"
                onClick={() => navigate("/join")}
              >
                join a poll
              </button>
              . Once your number is stored, your past results will show here automatically.
            </div>
          ) : subs.length === 0 ? (
            <div className="text-gray-500 text-sm">No submissions yet.</div>
          ) : (
            <div className="max-h-[60vh] overflow-auto pr-1">
              <ul className="space-y-3">
                {subs.map((s) => (
                  <li key={s.pollId}>
                    <div
                      role="button"
                      tabIndex={0}
                      className="w-full text-left rounded-2xl border border-purple-100 hover:border-purple-200 bg-white p-4 shadow-sm hover:shadow transition outline-none focus:ring-2 focus:ring-purple-400"
                      onClick={() => setSelected(s)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setSelected(s);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        {/* Left: poll info */}
                        <div>
                          <div className="text-lg font-bold text-gray-900">{s.title}</div>
                          <div className="text-xs text-gray-500">
                            Code: {s.joinCode} • {formatDate(s.submittedAt)}
                          </div>
                        </div>

                        {/* Right: score + delete */}
                        <div className="flex items-center gap-3">
                          <span className="inline-block rounded-full px-4 py-2 bg-purple-100 text-purple-800 text-sm font-bold shadow-inner">
                            {s.score}/{s.total}
                          </span>
                          <button
                            className="btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(s.pollId);
                            }}
                            aria-label="Delete this result"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Feedback modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{selected.title} — Result</h3>
              <button className="btn-secondary" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="inline-block rounded-full px-6 py-3 bg-purple-100 text-purple-800 text-xl font-bold">
                {selected.score}/{selected.total}
              </div>
            </div>

            <div className="space-y-4">
              {selected.feedback.map((f) => {
                const correctLabel = f.options[f.correctIndex]?.label ?? "?";
                const chosenLabel =
                  f.chosenIndex >= 0 ? (f.options[f.chosenIndex]?.label ?? "?") : "—";
                const badge = f.correct ? "text-green-700" : "text-red-700";
                return (
                  <div key={f.qIndex} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">
                        Question {f.qIndex + 1}: {f.question}
                      </div>
                      <span className={`text-sm ${badge}`}>
                        {f.correct ? "correct" : "incorrect"} • {f.correct ? "1" : "0"} out 1
                      </span>
                    </div>
                    <div className="mt-3 grid sm:grid-cols-2 gap-2">
                      {f.options.map((opt, oi) => {
                        const isChosen = oi === f.chosenIndex;
                        const isCorrect = oi === f.correctIndex;
                        const bg = isCorrect
                          ? "bg-green-100"
                          : isChosen && !isCorrect
                            ? "bg-red-100"
                            : "bg-gray-100";
                        const ring = isChosen ? "ring-2 ring-offset-2" : "";
                        return (
                          <div key={oi} className={`rounded-lg px-3 py-2 ${bg} ${ring}`}>
                            <span className="font-semibold mr-2">{opt.label}.</span>
                            {opt.text}
                            {isCorrect && (
                              <span className="ml-2 text-green-700 text-xs">(correct)</span>
                            )}
                            {isChosen && !isCorrect && (
                              <span className="ml-2 text-red-700 text-xs">(your choice)</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-sm mt-3">
                      You selected <strong>{chosenLabel}</strong> —{" "}
                      {f.correct ? "correct" : "incorrect"}. Correct Answer{" "}
                      <strong>{correctLabel}</strong>.
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
