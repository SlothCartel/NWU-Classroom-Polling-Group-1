import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPollStats, getPollById } from "@/lib/api";
import type { Poll } from "@/lib/types";

type QStat = { qIndex: number; text: string; correct: number; incorrect: number; notAnswered?: number; };

export default function StatsPage() {
  const params = useParams<{ id?: string; pollId?: string }>();
  const statId = params.pollId ?? params.id ?? "";
  const navigate = useNavigate();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [attendees, setAttendees] = useState<string[]>([]);
  const [perQuestion, setPerQuestion] = useState<QStat[]>([]);
  const [openAtt, setOpenAtt] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const csvFilename = useMemo(() => {
    const t = (poll?.title || "poll").replace(/[^a-z0-9_\- ]/gi, "").replace(/\s+/g, "_");
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    return `${t}_${ts}.csv`;
  }, [poll?.title]);

  useEffect(() => {
    let cancel = false;

    async function loadOnce() {
      if (!statId) return;
      try {
        const p = await getPollById(statId);
        if (!cancel) setPoll(p);
      } catch {}
    }

    async function tick() {
      if (!statId) return;
      try {
        const s = await getPollStats(statId);
        if (cancel) return;
        setAttendees(s.attendees);
        setPerQuestion(s.perQuestion as QStat[]);
      } finally {
        if (!cancel) setTimeout(tick, 2000);
      }
    }

    loadOnce();
    tick();
    return () => { cancel = true; };
  }, [statId]);

  const handleBack = () => navigate("/dashboard");

  function flash(kind: "ok" | "err", msg: string) {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3000);
  }

  function getStoredToken(): string | null {
    const keys = ["token", "authToken", "access_token", "accessToken", "jwt", "id_token"];
    for (const k of keys) {
      const v = localStorage.getItem(k) || sessionStorage.getItem(k);
      if (v && v.trim()) return v;
    }
    return null;
  }

  async function doExportCsv() {
    try {
      const token = getStoredToken();
      if (!token) { flash("err", "You’re not signed in."); setShowExportConfirm(false); return; }

      const res = await fetch(`/api/polls/${statId}/export?format=csv`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "text/csv,application/json" },
      });

      if (!res.ok) {
        let errText = `Export failed (${res.status})`;
        try { const j = await res.json(); if (j?.error) errText = j.error; } catch {}
        flash("err", errText);
        setShowExportConfirm(false);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = csvFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      flash("ok", "Export started — check your Downloads.");
    } catch (e: any) { flash("err", e?.message || "Export failed"); }
    finally { setShowExportConfirm(false); }
  }

  return (
    <div className="min-h-screen bg-purple-700 text-purple-900">
      <div className="mx-auto max-w-5xl p-6">
        <div className="bg-white/95 rounded-3xl shadow-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{poll?.title ?? "Poll stats"}</h1>
              <p className="text-sm text-gray-500">Live results (updates every ~2s)</p>
            </div>
            <button className="btn-secondary" onClick={handleBack}>Back to dashboard</button>
          </div>

          {/* Attendance */}
          <div className="mt-6">
            <button className="btn-primary" onClick={() => setOpenAtt(v => !v)} aria-expanded={openAtt}>
              Attendance ({attendees.length})
            </button>
            {openAtt && (
              <div className="mt-3 border rounded-xl p-3 max-h-56 overflow-auto">
                {attendees.length === 0 ? (
                  <div className="text-gray-500 text-sm">No students yet.</div>
                ) : (
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {attendees.map(s => <li key={s} className="font-mono bg-purple-50 rounded-lg px-3 py-2">{s}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Charts omitted for brevity */}

          <div className="mt-6 flex justify-end gap-3">
            <button className="btn-primary" onClick={() => setShowExportConfirm(true)}>Export to CSV</button>
          </div>
        </div>

        {showExportConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl p-6 w-[min(90vw,380px)] shadow-2xl">
              <h3 className="text-lg font-semibold mb-2">Export to CSV</h3>
              <p className="text-sm text-gray-600 mb-5">
                Are you sure you want to export this poll’s results to CSV?
              </p>
              <div className="flex justify-end gap-2">
                <button className="btn-secondary" onClick={() => setShowExportConfirm(false)}>No</button>
                <button className="btn-primary" onClick={doExportCsv}>Yes, export</button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl ${toast.kind === "ok" ? "bg-green-500" : "bg-red-500"} text-white`}>
            {toast.msg}
          </div>
        )}
      </div>
    </div>
  );
}
