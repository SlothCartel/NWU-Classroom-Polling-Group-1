import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import LecturerLoginPage from "@/pages/LecturerLoginPage";
import LecturerSignupPage from "@/pages/LecturerSignupPage";
import StudentLoginPage from "@/pages/StudentLoginPage";
import StudentSignupPage from "@/pages/StudentSignupPage";
import AdminPage from "@/pages/AdminPage";
import StudentPage from "@/pages/StudentPage";
import JoinPage from "@/pages/JoinPage";
import StatsPage from "@/pages/StatsPage";
import { getRole } from "@/lib/auth";

function RequireLecturer({ children }: { children: JSX.Element }) {
  return getRole() === "lecturer" ? children : <Navigate to="/lecturer-login" replace />;
}

function RequireStudent({ children }: { children: JSX.Element }) {
  return getRole() === "student" ? children : <Navigate to="/student-login" replace />;
}

/** If already signed in, skip the login screen */
function RedirectIfAuthed({ children }: { children: JSX.Element }) {
  const role = getRole();
  if (role === "lecturer") return <Navigate to="/dashboard" replace />;
  if (role === "student") return <Navigate to="/student" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* always start here */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* landing choice page (auto-skip if already authed) */}
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <LoginPage />
          </RedirectIfAuthed>
        }
      />

      {/* auth flows */}
      <Route
        path="/lecturer-login"
        element={
          <RedirectIfAuthed>
            <LecturerLoginPage />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/lecturer-signup"
        element={
          <RedirectIfAuthed>
            <LecturerSignupPage />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/student-login"
        element={
          <RedirectIfAuthed>
            <StudentLoginPage />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/student-signup"
        element={
          <RedirectIfAuthed>
            <StudentSignupPage />
          </RedirectIfAuthed>
        }
      />

      {/* protected student area */}
      <Route
        path="/student"
        element={
          <RequireStudent>
            <StudentPage />
          </RequireStudent>
        }
      />
      <Route
        path="/join"
        element={
          <RequireStudent>
            <JoinPage />
          </RequireStudent>
        }
      />

      {/* protected lecturer area */}
      <Route
        path="/dashboard"
        element={
          <RequireLecturer>
            <AdminPage />
          </RequireLecturer>
        }
      />
      <Route
        path="/stats/:id"
        element={
          <RequireLecturer>
            <StatsPage />
          </RequireLecturer>
        }
      />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
