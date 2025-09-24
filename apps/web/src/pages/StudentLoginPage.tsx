// src/pages/StudentLoginPage.tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { studentSignIn } from '@/lib/studentAuth'
import { setRole } from '@/lib/auth'

export default function StudentLoginPage() {
  const nav = useNavigate()
  const [number, setNumber] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    try {
      await studentSignIn(number, password)
      nav('/student', { replace: true })
    } catch (e: any) {
      setErr(e?.message ?? 'Sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-700 p-4">
      <div className="w-full max-w-md card p-6">
        <h2 className="text-xl font-bold mb-4">Student sign in</h2>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="label">Student number</label>
            <input className="input" value={number} onChange={e=>setNumber(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          {err && <div className="text-sm text-red-600">{err}</div>}
          <div className="flex gap-2">
            <button className="btn-primary" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
            <button type="button" className="btn-secondary" onClick={()=>nav('/login')}>Back</button>
          </div>
        </form>

        <div className="mt-3 flex items-center justify-between text-sm text-purple-700">
          <Link to="/student-signup" className="underline">Sign up</Link>
          <button className="underline" onClick={()=>alert('Mock: reset link (demo)')}>Forgot password?</button>
        </div>
      </div>
    </div>
  )
}
