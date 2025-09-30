import { useEffect, useMemo, useState } from 'react'
import { createPoll, listPolls, startPoll, closePoll, updatePoll } from '@/lib/api'
import type { Poll, QuizQuestion, ChoiceLabel } from '@/lib/types'

const LETTERS: ChoiceLabel[] = ['A', 'B', 'C', 'D']

function blankQuestion(): QuizQuestion {
  return {
    text: '',
    options: LETTERS.map((l) => ({ label: l, text: '' })),
    correctIndex: 0,
  }
}

export default function DashboardPage() {
  const [polls, setPolls] = useState<Poll[]>([])

  // Left card (Create a new poll)
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    Array.from({ length: 5 }, blankQuestion)
  )
  const [minutes, setMinutes] = useState<number>(5)        // quiz timer (mins)
  const [securityCode, setSecurityCode] = useState<string>('') // optional

  // Right card (per-poll quick edits: timer + code)
  const [edits, setEdits] = useState<Record<string, { minutes: number; securityCode: string }>>({})

  async function refresh() {
    const data = await listPolls()
    setPolls(data)
    // seed quick edit inputs from server values
    const next: Record<string, { minutes: number; securityCode: string }> = {}
    data.forEach(p => {
      next[p.id] = {
        minutes: Math.max(1, Math.round(p.timerSeconds / 60)),
        securityCode: p.securityCode ?? '',
      }
    })
    setEdits(next)
  }
  useEffect(() => { void refresh() }, [])

  // ------ create form handlers ------
  function updateQuestionText(i: number, text: string) {
    setQuestions(prev => {
      const copy = [...prev]
      copy[i] = { ...copy[i], text }
      return copy
    })
  }

  function updateOptionText(qIdx: number, oIdx: number, text: string) {
    setQuestions(prev => {
      const copy = [...prev]
      const q = { ...copy[qIdx] }
      const opts = [...q.options]
      opts[oIdx] = { ...opts[oIdx], text }
      q.options = opts
      copy[qIdx] = q
      return copy
    })
  }

  function setCorrect(qIdx: number, oIdx: number) {
    setQuestions(prev => {
      const copy = [...prev]
      copy[qIdx] = { ...copy[qIdx], correctIndex: oIdx }
      return copy
    })
  }

  const canSave = useMemo(() => {
    if (!title.trim()) return false
    if (minutes < 1) return false
    for (const q of questions) {
      if (!q.text.trim()) return false
      if (q.options.some(o => !o.text.trim())) return false
      if (q.correctIndex < 0 || q.correctIndex > 3) return false
    }
    return true
  }, [title, minutes, questions])

  async function onCreatePoll(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave) return

    await createPoll({
      title: title.trim(),
      questions: questions.map(q => ({
        text: q.text.trim(),
        options: q.options.map(o => ({ ...o, text: o.text.trim() })),
        correctIndex: q.correctIndex,
      })),
      timerSeconds: Math.max(60, Math.round(minutes) * 60),
      securityCode: securityCode.trim() || undefined,
    })

    // reset form
    setTitle('')
    setQuestions(Array.from({ length: 5 }, blankQuestion))
    setMinutes(5)
    setSecurityCode('')
    await refresh()
  }

  async function savePollSettings(p: Poll) {
    const edit = edits[p.id]
    if (!edit) return
    await updatePoll(p.id, {
      timerSeconds: Math.max(60, Math.round(edit.minutes) * 60),
      securityCode: edit.securityCode.trim() || undefined,
    })
    await refresh()
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* LEFT: Create a new poll (kept like screenshot) */}
      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-3">Create a new poll</h2>
        <form onSubmit={onCreatePoll} className="space-y-4">
          {/* Title */}
          <div>
            <label className="label">Title</label>
            <input
              className="input"
              value={title}
              placeholder="e.g. OS Quiz – Week 3"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Timer + Security Code */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Timer (minutes)</label>
              <input
                type="number"
                min={1}
                className="input"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Security code (optional)</label>
              <input
                className="input"
                placeholder="e.g. NWU2025"
                value={securityCode}
                onChange={(e) => setSecurityCode(e.target.value)}
              />
            </div>
          </div>

          {/* Questions (fixed 5, A–D) */}
          <div className="space-y-5">
            {questions.map((q, qi) => (
              <div key={qi} className="border rounded-xl p-4">
                <div className="mb-2 font-medium">Question {qi + 1}</div>
                <input
                  className="input mb-3"
                  placeholder="Enter question text"
                  value={q.text}
                  onChange={(e)=>updateQuestionText(qi, e.target.value)}
                />

                <div className="grid sm:grid-cols-2 gap-3">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`q${qi}-correct`}
                        checked={q.correctIndex === oi}
                        onChange={()=>setCorrect(qi, oi)}
                        aria-label={`Mark ${opt.label} as correct`}
                      />
                      <span className="w-6 text-center font-semibold">{opt.label}</span>
                      <input
                        className="input flex-1"
                        placeholder={`Option ${opt.label}`}
                        value={opt.text}
                        onChange={(e)=>updateOptionText(qi, oi, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  The selected radio marks the correct answer (hidden from students).
                </p>
              </div>
            ))}
          </div>

          <button className="btn-primary" disabled={!canSave}>Create poll</button>
        </form>
      </section>

      {/* RIGHT: Your polls (kept like screenshot) */}
      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-3">Your polls</h2>
        <div className="space-y-3">
          {polls.length === 0 && <p className="text-gray-500">No polls yet.</p>}
          {polls.map(p => (
            <div key={p.id} className="border rounded-xl p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.title}</div>
                  <div className="text-sm text-gray-500">
                    Status: {p.status} • Code: {p.joinCode}
                  </div>
                </div>
                <div className="flex gap-2">
                  {p.status !== 'live' && (
                    <button className="btn-primary" onClick={()=>startPoll(p.id).then(refresh)}>Start</button>
                  )}
                  {p.status === 'live' && (
                    <button className="btn-secondary" onClick={()=>closePoll(p.id).then(refresh)}>Close</button>
                  )}
                </div>
              </div>

              {/* Quick settings for timer + security code */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Timer (minutes)</label>
                  <input
                    type="number"
                    min={1}
                    className="input"
                    value={edits[p.id]?.minutes ?? 5}
                    onChange={(e)=>setEdits(prev => ({
                      ...prev,
                      [p.id]: {
                        ...(prev[p.id] ?? { minutes: 5, securityCode: '' }),
                        minutes: Number(e.target.value)
                      }
                    }))}
                  />
                </div>
                <div>
                  <label className="label">Security code</label>
                  <input
                    className="input"
                    placeholder="Optional"
                    value={edits[p.id]?.securityCode ?? ''}
                    onChange={(e)=>setEdits(prev => ({
                      ...prev,
                      [p.id]: {
                        ...(prev[p.id] ?? { minutes: 5, securityCode: '' }),
                        securityCode: e.target.value
                      }
                    }))}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button className="btn-secondary" onClick={()=>savePollSettings(p)}>
                  Save settings
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}