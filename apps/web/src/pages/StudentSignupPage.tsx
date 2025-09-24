// src/pages/StudentSignupPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { studentSignUp } from '@/lib/studentAuth'

export default function StudentSignupPage() {
  const nav = useNavigate()
  const [number, setNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (password !== confirm) { setErr('Passwords do not match'); return }
    setLoading(true)
    try {
      await studentSignUp(number, password)
      nav('/student', { replace: true })
    } catch (e: any) {
      setErr(e?.message ?? 'Sign-up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-700 p-4">
      <div className="w-full max-w-md card p-6">
        <h2 className="text-xl font-bold mb-4">Student sign up</h2>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="label">Student number</label>
            <input className="input" value={number} onChange={e=>setNumber(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          <div>
            <label className="label">Confirm password</label>
            <input className="input" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} />
          </div>
          {err && <div className="text-sm text-red-600">{err}</div>}
          <div className="flex gap-2">
            <button className="btn-primary" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
            <button type="button" className="btn-secondary" onClick={()=>nav('/student-login')}>Back</button>
          </div>
        </form>
      </div>
    </div>
  )
}
