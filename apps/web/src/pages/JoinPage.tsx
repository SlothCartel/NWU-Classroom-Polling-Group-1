// src/pages/JoinPage.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getPollByCode,
  getPollStatusByCode,        // <-- use status endpoint for end detection
  studentJoin,
  submitAnswers,
  recordLiveChoice
} from '@/lib/api'
import type { StudentPoll, SubmitResult } from '@/lib/types'
import { setRole } from '@/lib/auth'            // ensure student role to pass guards

export default function JoinPage() {
  const navigate = useNavigate()

  // join form
  const [joinCode, setJoinCode] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const [securityCode, setSecurityCode] = useState('')

  // poll + answers
  const [poll, setPoll] = useState<StudentPoll | null>(null)
  const [answers, setAnswers] = useState<number[]>([]) // -1 = unanswered
  const [result, setResult] = useState<SubmitResult | null>(null)

  // ui
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [waiting, setWaiting] = useState(false)

  // timer
  const [deadline, setDeadline] = useState<number | null>(null)
  const [tick, setTick] = useState(0)
  const remaining = useMemo(() => {
    if (deadline === null) return 0
    return Math.max(0, Math.floor((deadline - Date.now()) / 1000))
  }, [deadline, tick])

  const autoSubmittedRef = useRef(false)

  // ✅ Assert student role on mount (prevents guard redirects)
  useEffect(() => {
    setRole('student')
  }, [])

  // 1s ticker
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // start deadline when poll becomes live
  useEffect(() => {
    if (!poll) return
    setDeadline(Date.now() + poll.timerSeconds * 1000)
  }, [poll])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    setResult(null)
    autoSubmittedRef.current = false
    setDeadline(null)

    try {
      const meta = await getPollByCode(joinCode.trim())
      await studentJoin({
        joinCode: joinCode.trim(),
        studentNumber: studentNumber.trim(),
        securityCode: securityCode.trim() || undefined,
      })

      // lock role as student once they join
      setRole('student')

      if (meta.status === 'open') {
        setWaiting(true)
        const loop = async () => {
          try {
            const m = await getPollByCode(joinCode.trim())
            if (m.status === 'live') {
              setWaiting(false)
              setPoll(m)
              setAnswers(Array(m.questions.length).fill(-1))
            } else if (m.status === 'closed') {
              setWaiting(false)
              setError('This poll was closed before it started.')
            } else {
              setTimeout(loop, 1000)
            }
          } catch {
            setTimeout(loop, 1000)
          }
        }
        loop()
      } else if (meta.status === 'live') {
        setPoll(meta)
        setAnswers(Array(meta.questions.length).fill(-1))
      } else if (meta.status === 'closed') {
        setError('This poll is closed and no longer accepting answers.')
      } else {
        setError('This poll is not accepting answers yet.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to join')
    } finally {
      setLoading(false)
    }
  }

  function selectAnswer(qIdx: number, choiceIdx: number) {
    setAnswers(prev => {
      const copy = [...prev]
      copy[qIdx] = choiceIdx
      return copy
    })
    // optional live-tracking; ignore errors
    if (poll && studentNumber.trim()) {
      recordLiveChoice(poll.id, studentNumber.trim(), qIdx, choiceIdx).catch(() => {})
    }
  }

  async function submitNow(reason: 'manual' | 'timeup' | 'ended') {
    if (!poll || autoSubmittedRef.current || result) return
    autoSubmittedRef.current = true
    setError(null)
    try {
      const res = await submitAnswers({
        pollId: poll.id,
        answers,
        studentNumber: studentNumber.trim(),
        securityCode: securityCode.trim() || undefined,
      })
      setResult(res)
      setDeadline(null) // stop the timer display
    } catch (err: any) {
      setError(err.message || 'Submission failed')
      autoSubmittedRef.current = false // allow retry if manual
    }
  }

  const canSubmit = !!poll && !result && studentNumber.trim().length > 0 && remaining > 0
  const handleSubmit = () => submitNow('manual')

  // ---------- AUTO-SUBMIT: TIME UP (robust wall-clock check) ----------
  useEffect(() => {
    if (!poll || result) return
    if (deadline === null) return
    // Compare against Date.now() every tick so it fires even if remaining rendering lags
    if (!autoSubmittedRef.current && Date.now() >= deadline) {
      submitNow('timeup')
    }
  }, [tick, deadline, poll, result])

  // ---------- AUTO-SUBMIT: LECTURER ENDED ----------
  useEffect(() => {
    if (!poll || result) return
    let cancelled = false

    async function pollStatus() {
      try {
        const { status } = await getPollStatusByCode(joinCode.trim())
        if (cancelled) return

        // Treat both 'closed' and 'missing' as end signal
        if (status === 'closed' || status === 'missing') {
          if (!autoSubmittedRef.current) submitNow('ended')
          return
        }
      } catch {
        // transient network error: just keep polling
      }
      if (!cancelled && !autoSubmittedRef.current && !result) {
        setTimeout(pollStatus, 1000)
      }
    }

    pollStatus()
    return () => { cancelled = true }
  }, [poll, result, joinCode])

  // -------- UI --------

  // 1) Join screen
  if (!poll && !result) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Join poll</h2>
          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
          <form onSubmit={handleJoin} className="space-y-3">
            <div>
              <label className="label">Join code</label>
              <input className="input" value={joinCode} onChange={(e)=>setJoinCode(e.target.value)} />
            </div>
            <div>
              <label className="label">Student number</label>
              <input className="input" value={studentNumber} onChange={(e)=>setStudentNumber(e.target.value)} />
            </div>
            <div>
              <label className="label">Security code (if required)</label>
              <input className="input" value={securityCode} onChange={(e)=>setSecurityCode(e.target.value)} />
            </div>
            <button className="btn-primary" disabled={loading}>
              {loading ? 'Joining…' : 'Join'}
            </button>
            {waiting && <p className="text-sm text-gray-600 mt-2">Waiting for the lecturer to start…</p>}
          </form>
        </div>
      </div>
    )
  }

  // 2) Results screen
  if (result) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h2 className="text-xl font-bold mb-4">You got</h2>
          <div className="text-center text-3xl font-bold mb-6">
            {result.score} / {result.total}
          </div>
          {result.feedback.map(f => (
            <div key={f.qIndex} className="border rounded-xl p-4 mb-4">
              <h3 className="font-semibold mb-2">Question {f.qIndex + 1}: {f.question}</h3>
              <ul className="space-y-1">
                {f.options.map((opt, oi) => {
                  const isChosen = f.chosenIndex === oi
                  const isCorrect = f.correctIndex === oi
                  return (
                    <li key={oi} className={`px-2 py-1 rounded ${isCorrect ? 'bg-green-100' : isChosen ? 'bg-red-100' : ''}`}>
                      {opt.label}. {opt.text} {isCorrect ? '(correct)' : isChosen ? '(your choice)' : ''}
                    </li>
                  )
                })}
              </ul>
              <p className="text-sm mt-2">
                You selected {f.chosenIndex >= 0 ? f.options[f.chosenIndex].label : '—'} — {f.correct ? 'correct' : 'incorrect'}.
                {' '}Correct Answer {f.options[f.correctIndex].label}.
              </p>
            </div>
          ))}
          <button
            className="btn-primary"
            onClick={() => { setRole('student'); navigate('/student') }}
          >
            Back to my results
          </button>
        </div>
      </div>
    )
  }

  // 3) Quiz-taking screen
  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-3xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{poll!.title}</h2>
          <div className="text-sm text-gray-600">
            Time left: <strong>{Math.floor(remaining/60)}:{String(remaining%60).padStart(2,'0')}</strong>
          </div>
        </div>

        {poll!.questions.map((q, qi) => (
          <div key={qi} className="border rounded-xl p-4 mb-4">
            <h3 className="font-semibold mb-2">Q{qi + 1}. {q.text}</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {q.options.map((o, oi) => (
                <button
                  key={oi}
                  type="button"
                  className={`btn-secondary justify-start ${answers[qi] === oi ? 'ring-2 ring-offset-2' : ''}`}
                  onClick={()=>selectAnswer(qi, oi)}
                  aria-pressed={answers[qi] === oi}
                >
                  <span className="font-bold mr-2">{o.label}.</span> {o.text}
                </button>
              ))}
            </div>
          </div>
        ))}

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <button className="btn-primary" disabled={!canSubmit} onClick={handleSubmit}>
          Submit answers
        </button>
      </div>
    </div>
  )
}
