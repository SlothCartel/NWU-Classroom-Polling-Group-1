import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setRole } from '@/lib/auth'

type AccountStore = Record<string, { email: string; password: string; createdAt: number }>
const LS_KEY = 'lecturer_accounts_v1'

function loadAccounts(): AccountStore {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as AccountStore) : {}
  } catch {
    return {}
  }
}
function saveAccounts(db: AccountStore) {
  localStorage.setItem(LS_KEY, JSON.stringify(db))
}

export default function LecturerSignupPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function validate(): string | null {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    if (!ok) return 'Please enter a valid email.'
    if (password.length < 6) return 'Password must be at least 6 characters.'
    if (password !== confirm) return 'Passwords do not match.'
    return null
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const v = validate()
    if (v) { setError(v); return }

    setLoading(true)
    try {
      const db = loadAccounts()
      const key = email.trim().toLowerCase()
      if (db[key]) {
        setError('An account with this email already exists.')
        return
      }
      db[key] = { email: key, password, createdAt: Date.now() }
      saveAccounts(db)

      // mock auth -> into dashboard
      setRole('lecturer')
      navigate('/dashboard', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-purple-700 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-5">Lecturer sign up</h1>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-3">
          <div>
            <label className="label">Email</label>
            <input
              className="input w-full"
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              className="input w-full"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="label">Confirm password</label>
            <input
              className="input w-full"
              type="password"
              placeholder="Re-enter password"
              value={confirm}
              onChange={(e)=>setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>

          <div className="flex items-center justify-between pt-1">
            <button type="button" className="btn-secondary" onClick={() => navigate('/lecturer-login')}>
              Back
            </button>
            <Link to="/lecturer-login" className="text-purple-700 hover:underline text-sm">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
