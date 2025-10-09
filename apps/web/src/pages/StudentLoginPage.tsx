// src/pages/StudentLoginPage.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { studentSignIn } from "@/lib/api";

export default function StudentLoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");           // NEW
  const [number, setNumber] = useState("");         // existing
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      // Prefer the typed email; otherwise we’ll pass the number and api.ts will derive the email pattern.
      const identifier = email.trim() || number.trim();
      await studentSignIn(identifier, password);

      // Optional: remember the student number for joins/history
      if (number.trim()) localStorage.setItem("studentNumber", number.trim());

      nav("/student", { replace: true });
    } catch (e: any) {
      const msg = e?.message || "Sign-in failed";
      try {
        const parsed = JSON.parse(msg);
        setErr(parsed.error || msg);
      } catch {
        setErr(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-700 p-4">
      <div className="w-full max-w-md card p-6">
        <h2 className="text-xl font-bold mb-4">Student sign in</h2>
        <form className="space-y-3" onSubmit={onSubmit}>
          {/* NEW: Email field (optional) */}
          <div>
            <label className="label">Email (optional)</label>
            <input
              className="input"
              type="email"
              placeholder="student12345678@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
            <p className="text-xs text-gray-500 mt-1">
              You can enter your email, or leave it empty and use your student number below.
            </p>
          </div>

          {/* Existing: Student number */}
          <div>
            <label className="label">Student number</label>
            <input
              className="input"
              placeholder="e.g. 37613480"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {err && <div className="text-sm text-red-600">{err}</div>}

          <div className="flex gap-2">
            <button className="btn-primary" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => nav("/login")}>
              Back
            </button>
          </div>
        </form>

        <div className="mt-3 flex items-center justify-between text-sm text-purple-700">
          <Link to="/student-signup" className="underline">Sign up</Link>
          <button className="underline" onClick={() => alert("Mock: reset link (demo)")}>
            Forgot password?
          </button>
        </div>
      </div>
    </div>
  );
}
