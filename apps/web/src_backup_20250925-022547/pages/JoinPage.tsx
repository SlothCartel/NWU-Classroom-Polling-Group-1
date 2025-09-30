import { useEffect, useMemo, useState } from 'react'
import { getPollByCode, submitAnswers } from '@/lib/api'
import type { StudentPoll } from '@/lib/types'

export default function JoinPage() {
  const [joinCode, setJoinCode] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const [securityCode, setSecurityCode] = useState('')
  const [poll, setPoll] = useState<StudentPoll | null>(null)
  const [answers, setAnswers] = useState<number[]>([]) // 0..3 per question
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // simple countdown (client-side; server must still enforce)
  const [deadline, setDeadline] = useState<number | null>(null)
  const remaining = useMemo(() => {
    if (!deadline) return 0
    return Math.max(0, Math.floor((deadline - Date.now()) / 1000))
  }, [deadline])
  useEffect(() => {
    if (!poll) return
    setDeadline(Date.now() + poll.timerSeconds * 1000)
    const t = setInterval(() => {
      // state update trigger
    }, 1000)
    return () => clearInterval(t)
  }, [poll])

  async function handleLoad(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const p = await getPollByCode(joinCode.trim())
      if (p.status !== 'live') throw new Error('This poll is not live.')
      setPoll(p)
      setAnswers(Array(p.questions.length).fill(-1)) // -1 = not answered yet
    } catch (err: any) {
      setError(err.message || 'Failed to load poll')
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
  }

  const canSubmit = useMemo(() => {
    return poll && answers.length === poll.questions.length && answers.every(a => a >= 0 && a <= 3) && studentNumber.trim().length > 0
  }, [poll, answers, studentNumber])

  async function handleSubmit() {
    if (!poll) return
    setError(null)
    try {
      await submitAnswers({
        pollId: poll.id,
        answers,
        studentNumber: studentNumber.trim(),
        securityCode: securityCode.trim() || undefined,
      })
      alert('Submitted!') // replace with a nicer UI if you like
    } catch (err: any) {
      setError(err.message || 'Submission failed')
    }
  }

  // ----- UI -----
  if (!poll) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h2 className="text-xl font-semibold mb-4">Join poll</h2>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <form onSubmit={handleLoad} className="space-y-3">
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
            {loading ? 'Loading…' : 'Join'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{poll.title}</h2>
        <div className="text-sm text-gray-600">
          Time left: <strong>{Math.floor(remaining/60)}:{String(remaining%60).padStart(2,'0')}</strong>
        </div>
      </div>

      {poll.questions.map((q, qi) => (
        <div key={qi} className="card p-4 mb-4">
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
      <button className="btn-primary" disabled={!canSubmit || remaining === 0} onClick={handleSubmit}>
        Submit answers
      </button>
    </div>
  )
}