import { Navigate, Outlet } from "react-router-dom";
import { getRole } from "@/lib/auth";

// Only allow when role matches; else send back to login
export function RequireRole({ role }: { role: "student" | "lecturer" }) {
  const current = getRole();
  if (current !== role) return <Navigate to="/" replace />;
  return <Outlet />;
}

// Only accessible when NOT logged in (for /)
export function RequireAnon() {
  const current = getRole();
  if (current) {
    // redirect logged-in users to their default
    return <Navigate to={current === "student" ? "/join" : "/dashboard"} replace />;
  }
  return <Outlet />;
}
