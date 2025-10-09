// web/src/pages/StudentSignupPage.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { studentSignUp } from "@/lib/api";

export default function StudentSignupPage() {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): string | null {
    if (name.trim().length < 2) return "Please enter your full name.";
    if (!/^\d{5,}$/.test(studentNumber.trim()))
      return "Student number looks invalid.";
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!okEmail) return "Please enter a valid email.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (password !== confirm) return "Passwords do not match.";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const v = validate();
    if (v) return setErr(v);

    setLoading(true);
    try {
      await studentSignUp({
        name: name.trim(),
        studentNumber: studentNumber.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      // Do NOT auto-login; go back to the role selection page
      nav("/login", { replace: true });
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ||
        e?.message ||
        "Signup failed. Please try again.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-700 p-4">
      <div className="w-full max-w-md card p-6">
        <h2 className="text-xl font-bold mb-4">Student sign up</h2>

        {err && (
          <div className="mb-3 rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">
            {err}
          </div>
        )}

        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="label">Full name</label>
            <input
              className="input w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder="e.g. Alex Dlamini"
            />
          </div>

          <div>
            <label className="label">Student number</label>
            <input
              className="input w-full"
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              placeholder="e.g. 37613480"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              className="input w-full"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@student.nwu.ac.za"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              className="input w-full"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="label">Confirm password</label>
            <input
              className="input w-full"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>

          <div className="flex items-center justify-between pt-1">
            <button type="button" className="btn-secondary" onClick={() => nav("/student-login")}>
              Back
            </button>
            <Link to="/student-login" className="text-purple-700 hover:underline text-sm">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
