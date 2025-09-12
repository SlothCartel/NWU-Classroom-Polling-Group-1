import { NavLink, Routes, Route } from 'react-router-dom'
import JoinPage from './pages/JoinPage'
import DashboardPage from './pages/DashboardPage'
import AdminPage from './pages/AdminPage'

// helper to highlight active nav item
const nav =
  (base: string) =>
  ({ isActive }: { isActive: boolean }) =>
    (base + (isActive ? ' ring-2 ring-nwu-accent' : '')).trim()

function Landing() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-2">Guest participation</h2>
        <p className="text-gray-600 mb-4">Join with a code—no login required.</p>
        <NavLink to="/join" className="btn-primary">Join a poll</NavLink>
      </section>

      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-2">Lecturer dashboard</h2>
        <p className="text-gray-600 mb-4">Create a poll, start a session and see results live.</p>
        <NavLink to="/dashboard" className="btn-secondary">Open dashboard</NavLink>
      </section>
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container flex items-center justify-between py-3">
          <NavLink to="/" className="font-semibold text-nwu-primary">
            NWU Live Poll
          </NavLink>
          <nav className="flex gap-3 text-sm">
            <NavLink className={nav('btn-secondary')} to="/join">Join</NavLink>
            <NavLink className={nav('btn-secondary')} to="/dashboard">Dashboard</NavLink>
            <NavLink className={nav('btn-primary')} to="/admin">Admin</NavLink>
          </nav>
        </div>
      </header>

      <main className="container py-6">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  )
}
