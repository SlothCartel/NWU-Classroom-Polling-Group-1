import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Header() {
  const [role, setRole] = useState<string | null>(localStorage.getItem("role"));
  const navigate = useNavigate();

  useEffect(() => {
    const onStorage = () => setRole(localStorage.getItem("role"));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const signOut = () => {
    localStorage.removeItem("role");
    setRole(null);
    navigate("/"); // back to login
  };

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="container flex items-center justify-between py-3">
        <NavLink to="/" className="font-semibold text-nwu-primary">
          NWU Live Poll
        </NavLink>

        <nav className="flex gap-3 text-sm">
          {role === "student" && (
            <NavLink className="btn-secondary" to="/join">
              Join
            </NavLink>
          )}

          {role === "lecturer" && (
            <>
              <NavLink className="btn-secondary" to="/dashboard">
                Dashboard
              </NavLink>
              <NavLink className="btn-primary" to="/admin">
                Admin
              </NavLink>
            </>
          )}

          {!role && (
            <NavLink className="btn-secondary" to="/">
              Login
            </NavLink>
          )}

          {role && (
            <button className="btn-secondary" onClick={signOut}>
              Sign out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
