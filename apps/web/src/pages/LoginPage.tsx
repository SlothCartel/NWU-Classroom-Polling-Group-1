// src/pages/LoginPage.tsx
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { getRole, clearAuth } from '@/lib/auth'

export default function LoginPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Optional: if you want dev always to start fresh
    clearAuth()

    const role = getRole()
    if (role === 'lecturer') navigate('/dashboard')
    // if (role === 'student') navigate('/student') // enable if you want auto-jump
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function gotoLecturer() {
    clearAuth() // wipe old student session
    navigate('/lecturer-login')
  }

  function gotoStudent() {
    clearAuth() // wipe old lecturer session
    navigate('/student-login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-700 p-6">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow">
            NWU Live Poll
          </h1>
          <p className="text-purple-100 mt-2">Choose your role to continue</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            className="group rounded-2xl bg-white/95 hover:bg-white transition shadow-lg p-6 text-left"
            onClick={gotoStudent}
          >
            <div className="text-sm font-semibold uppercase tracking-wide text-purple-700 mb-2">I’m a</div>
            <div className="text-2xl font-bold mb-2">Student</div>
            <p className="text-gray-600">Join a live poll and view your previous results.</p>
            <div className="mt-5 inline-flex items-center gap-2 text-purple-700 font-semibold">
              Go to Student
              <span className="group-hover:translate-x-1 transition">➜</span>
            </div>
          </button>

          <button
            className="group rounded-2xl bg-white/95 hover:bg-white transition shadow-lg p-6 text-left"
            onClick={gotoLecturer}
          >
            <div className="text-sm font-semibold uppercase tracking-wide text-purple-700 mb-2">I’m a</div>
            <div className="text-2xl font-bold mb-2">Lecturer</div>
            <p className="text-gray-600">Sign in to create polls and manage sessions.</p>
            <div className="mt-5 inline-flex items-center gap-2 text-purple-700 font-semibold">
              Go to Sign in
              <span className="group-hover:translate-x-1 transition">➜</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
