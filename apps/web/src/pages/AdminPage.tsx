import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createPoll, listPolls, startPoll, closePoll, updatePoll, openPoll, deletePoll,
} from '@/lib/api'
import type { Poll, QuizQuestion, ChoiceLabel } from '@/lib/types'

const LETTERS: ChoiceLabel[] = ['A', 'B', 'C', 'D']
const blankQuestion = (): QuizQuestion => ({
  text: '',
  options: LETTERS.map(l => ({ label: l, text: '' })),
  correctIndex: 0,
})

export default function AdminPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const navigate = useNavigate()

  // Back to login
  function goBackToLogin() {
    localStorage.removeItem('role') // optional
    navigate('/login')
  }

  // LEFT: create
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<QuizQuestion[]>(Array.from({ length: 5 }, blankQuestion))
  const [minutes, setMinutes] = useState<number>(5)
  const [securityCode, setSecurityCode] = useState<string>('')

  // RIGHT: quick edits
  const [edits, setEdits] = useState<Record<string, { minutes: number; securityCode: string }>>({})

  // EDIT MODAL
  const [editing, setEditing] = useState<{
    id: string
    title: string
    questions: QuizQuestion[]
  } | null>(null)

  async function refresh() {
    const data = await listPolls()
    setPolls(data)
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

  // ----- create handlers -----
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

  // ----- EDIT modal handlers -----
  function openEditModal(p: Poll) {
    const qs: QuizQuestion[] = p.questions.map(q => ({
      text: q.text,
      correctIndex: q.correctIndex,
      options: q.options.map(o => ({ label: o.label, text: o.text })),
    }))
    setEditing({ id: p.id, title: p.title, questions: qs })
  }

  function editUpdateQText(i: number, text: string) {
    setEditing(prev => prev ? {
      ...prev,
      questions: prev.questions.map((q, idx) => idx === i ? { ...q, text } : q)
    } : prev)
  }
  function editUpdateOpt(qIdx: number, oIdx: number, text: string) {
    setEditing(prev => {
      if (!prev) return prev
      const qs = [...prev.questions]
      const q = { ...qs[qIdx] }
      const opts = [...q.options]
      opts[oIdx] = { ...opts[oIdx], text }
      q.options = opts
      qs[qIdx] = q
      return { ...prev, questions: qs }
    })
  }
  function editSetCorrect(qIdx: number, oIdx: number) {
    setEditing(prev => prev ? {
      ...prev,
      questions: prev.questions.map((q, idx) => idx === qIdx ? { ...q, correctIndex: oIdx } : q)
    } : prev)
  }

  const canSaveEdit = useMemo(() => {
    if (!editing) return false
    if (!editing.title.trim()) return false
    for (const q of editing.questions) {
      if (!q.text.trim()) return false
      if (q.options.some(o => !o.text.trim())) return false
      if (q.correctIndex < 0 || q.correctIndex > 3) return false
    }
    return true
  }, [editing])

  async function confirmSaveEdit() {
    if (!editing || !canSaveEdit) return
    await updatePoll(editing.id, {
      title: editing.title.trim(),
      questions: editing.questions.map(q => ({
        text: q.text.trim(),
        correctIndex: q.correctIndex,
        options: q.options.map(o => ({ label: o.label, text: o.text.trim() })),
      }))
    })
    setEditing(null)
    await refresh()
  }

  async function confirmDelete(id: string) {
    if (!confirm('Delete this poll? This cannot be undone.')) return
    await deletePoll(id)
    await refresh()
  }

  return (
    <>
      {/* Top bar */}
      <div className="flex items-center justify-end p-3">
        <button className="btn-secondary" onClick={goBackToLogin}>
          Back to login
        </button>
      </div>

      {/* Main grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* LEFT: Create */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold mb-3">Create a new poll</h2>
          <form onSubmit={onCreatePoll} className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input className="input" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="e.g. OS Quiz – Week 3" />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Timer (minutes)</label>
                <input type="number" min={1} className="input" value={minutes} onChange={(e)=>setMinutes(Number(e.target.value))} />
              </div>
              <div>
                <label className="label">Security code (optional)</label>
                <input className="input" value={securityCode} onChange={(e)=>setSecurityCode(e.target.value)} placeholder="e.g. NWU2025" />
              </div>
            </div>

            <div className="space-y-5">
              {questions.map((q, qi) => (
                <div key={qi} className="border rounded-xl p-4">
                  <div className="mb-2 font-medium">Question {qi + 1}</div>
                  <input className="input mb-3" placeholder="Enter question text"
                    value={q.text} onChange={(e)=>updateQuestionText(qi, e.target.value)} />
                  <div className="grid sm:grid-cols-2 gap-3">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input type="radio" name={`q${qi}-correct`}
                          checked={q.correctIndex === oi} onChange={()=>setCorrect(qi, oi)} />
                        <span className="w-6 text-center font-semibold">{opt.label}</span>
                        <input className="input flex-1" placeholder={`Option ${opt.label}`}
                          value={opt.text} onChange={(e)=>updateOptionText(qi, oi, e.target.value)} />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">The selected radio marks the correct answer.</p>
                </div>
              ))}
            </div>

            <button className="btn-primary" disabled={!canSave}>Create poll</button>
          </form>
        </section>

        {/* RIGHT: Your polls */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold mb-3">Your polls</h2>
          <div className="space-y-3">
            {polls.length === 0 && <p className="text-gray-500">No polls yet.</p>}
            {polls.map(p => (
              <div key={p.id} className="border rounded-xl p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{p.title}</div>
                    <div className="text-sm text-gray-500">Status: {p.status} • Code: {p.joinCode}</div>
                    {p.securityCode && (
                      <div className="text-xs text-gray-600 mt-1">
                        Security code: <span className="font-mono">{p.securityCode}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {p.status === 'draft' && (
                      <button className="btn-primary" onClick={()=>openPoll(p.id).then(refresh)}>Open for joining</button>
                    )}
                    {p.status === 'open' && (
                      <>
                        <button className="btn-primary" onClick={()=>startPoll(p.id).then(refresh)}>Start</button>
                        <button className="btn-secondary" onClick={()=>closePoll(p.id).then(refresh)}>Close</button>
                      </>
                    )}
                    {p.status === 'live' && (
                      <button className="btn-secondary" onClick={()=>closePoll(p.id).then(refresh)}>End</button>
                    )}
                    <button className="btn-secondary" onClick={()=>openEditModal(p)}>Edit</button>
                    <button className="btn-secondary" onClick={()=>confirmDelete(p.id)}>Delete</button>
                  </div>
                </div>

                {/* quick settings */}
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
                        [p.id]: { ...(prev[p.id] ?? { minutes: 5, securityCode: '' }), minutes: Number(e.target.value) }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="label">Security code</label>
                    <input
                      className="input"
                      value={edits[p.id]?.securityCode ?? ''}
                      placeholder="Optional"
                      onChange={(e)=>setEdits(prev => ({
                        ...prev,
                        [p.id]: { ...(prev[p.id] ?? { minutes: 5, securityCode: '' }), securityCode: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className="btn-secondary" onClick={()=>savePollSettings(p)}>Save settings</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-3">Edit poll</h3>

            <div className="mb-4">
              <label className="label">Title</label>
              <input className="input" value={editing.title}
                onChange={(e)=>setEditing(prev => prev ? { ...prev, title: e.target.value } : prev)} />
            </div>

            <div className="space-y-5">
              {editing.questions.map((q, qi) => (
                <div key={qi} className="border rounded-xl p-4">
                  <div className="mb-2 font-medium">Question {qi + 1}</div>
                  <input className="input mb-3" value={q.text}
                    onChange={(e)=>editUpdateQText(qi, e.target.value)} />
                  <div className="grid sm:grid-cols-2 gap-3">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input type="radio" name={`edit-q${qi}-correct`}
                          checked={q.correctIndex === oi} onChange={()=>editSetCorrect(qi, oi)} />
                        <span className="w-6 text-center font-semibold">{opt.label}</span>
                        <input className="input flex-1" value={opt.text}
                          onChange={(e)=>editUpdateOpt(qi, oi, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-secondary" onClick={()=>setEditing(null)}>Cancel</button>
              <button className="btn-primary" disabled={!canSaveEdit} onClick={confirmSaveEdit}>Save changes</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}