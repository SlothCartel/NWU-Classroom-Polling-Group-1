import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/nwu.png";

type Mode = "role" | "lecturer-signin" | "lecturer-signup" | "lecturer-forgot" | "student";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("role");
  const navigate = useNavigate();

  // tiny helper to “log in” with a role
  const setRoleAndGo = (role: "lecturer" | "student", to: string) => {
    localStorage.setItem("role", role);
    navigate(to);
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-gray-50"
      style={{
        backgroundImage: `url(${logo})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "40%",
      }}
    >
      <div className="card p-6 w-full max-w-md bg-white/95">
        {mode === "role" && (
          <>
            <h2 className="text-lg font-semibold mb-4 text-center">NWU Live Poll</h2>
            <div className="flex gap-4">
              <button className="btn-primary w-1/2" onClick={() => setMode("lecturer-signin")}>
                Lecturer
              </button>
              <button className="btn-secondary w-1/2" onClick={() => setMode("student")}>
                Student
              </button>
            </div>
          </>
        )}

        {mode === "lecturer-signin" && (
          <div className="space-y-4">
            <h3 className="font-semibold">Lecturer sign in</h3>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input bg-gray-100" />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input bg-gray-100" />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setRoleAndGo("lecturer", "/dashboard")} // -> Dashboard
              >
                Sign in
              </button>
              <button type="button" className="btn-secondary" onClick={() => setMode("role")}>
                Back
              </button>
            </div>
            <div className="flex justify-between text-sm">
              <button className="text-nwu-primary hover:underline" onClick={() => setMode("lecturer-forgot")}>
                Forgot password?
              </button>
              <button className="text-nwu-primary hover:underline" onClick={() => setMode("lecturer-signup")}>
                Sign up
              </button>
            </div>
          </div>
        )}

        {mode === "lecturer-signup" && (
          <div className="space-y-4">
            <h3 className="font-semibold">Lecturer sign up</h3>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input bg-gray-100" />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input bg-gray-100" />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input type="password" className="input bg-gray-100" />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setRoleAndGo("lecturer", "/dashboard")} // -> Dashboard after signup
              >
                Sign up
              </button>
              <button type="button" className="btn-secondary" onClick={() => setMode("lecturer-signin")}>
                Back
              </button>
            </div>
          </div>
        )}

        {mode === "lecturer-forgot" && (
          <div className="space-y-4">
            <h3 className="font-semibold">Reset password</h3>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input bg-gray-100" />
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-primary">Reset</button>
              <button type="button" className="btn-secondary" onClick={() => setMode("lecturer-signin")}>
                Back
              </button>
            </div>
          </div>
        )}

        {mode === "student" && (
          <div className="space-y-4">
            <h3 className="font-semibold">Student login</h3>
            <div>
              <label className="label">Student Number</label>
              <input type="text" className="input bg-gray-100" />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setRoleAndGo("student", "/join")} // -> Join
              >
                Continue
              </button>
              <button type="button" className="btn-secondary" onClick={() => setMode("role")}>
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
