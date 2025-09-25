import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setRole } from "@/lib/auth";

type AccountStore = Record<string, { email: string; password: string; createdAt: number }>;
const LS_KEY = "lecturer_accounts_v1";

function loadAccounts(): AccountStore {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as AccountStore) : {};
  } catch {
    return {};
  }
}

export default function LecturerLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const db = loadAccounts();
      const key = email.trim().toLowerCase();
      const acct = db[key];
      if (!acct || acct.password !== password) {
        setError("Invalid email or password.");
        return;
      }
      setRole("lecturer");
      navigate("/dashboard", { replace: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-purple-700 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-5">Lecturer sign in</h1>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
        )}

        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="label">Email</label>
            <input
              className="input w-full"
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              className="input w-full"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-center gap-2">
            <button className="btn-primary" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate("/login")}>
              Back
            </button>
          </div>

          {/* Links row — swap order to match Student page */}
          <div className="flex items-center justify-between pt-1">
            <Link to="/lecturer-signup" className="text-purple-700 hover:underline text-sm">
              Sign up
            </Link>
            <Link to="#" className="text-purple-700 hover:underline text-sm">
              Forgot password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
