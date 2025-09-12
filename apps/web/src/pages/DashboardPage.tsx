import { useEffect, useState } from 'react'
import { createPoll, listPolls, startPoll, closePoll } from '@/lib/api'
import type { Poll } from '@/lib/types'

export default function DashboardPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [question, setQuestion] = useState('')
  const [opts, setOpts] = useState<string[]>(['', ''])

  async function refresh() {
    setPolls(await listPolls())
  }
  useEffect(() => { void refresh() }, [])

  function updateOpt(i: number, value: string) {
    const copy = [...opts]
    copy[i] = value
    setOpts(copy)
  }

  async function addPoll(e: React.FormEvent) {
    e.preventDefault()
    const labels = opts.map(s => s.trim()).filter(Boolean).slice(0, 5)
    if (!question.trim() || labels.length < 2) return
    await createPoll(question.trim(), labels)
    setQuestion('')
    setOpts(['', ''])
    await refresh()
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-3">Create a new poll</h2>
        <form onSubmit={addPoll} className="space-y-3">
          <div>
            <label className="label">Question</label>
            <input className="input" value={question} onChange={e=>setQuestion(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="label">Options (2–5)</label>
            {opts.map((o, i) => (
              <input key={i} className="input" placeholder={`Option ${i+1}`} value={o}
                onChange={e=>updateOpt(i, e.target.value)} />
            ))}
            {opts.length < 5 && (
              <button type="button" className="btn-secondary" onClick={()=>setOpts([...opts, ''])}>
                + Add option
              </button>
            )}
          </div>
          <button className="btn-primary">Create poll</button>
        </form>
      </section>

      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-3">Your polls</h2>
        <div className="space-y-3">
          {polls.length === 0 && <p className="text-gray-500">No polls yet.</p>}
          {polls.map(p => (
            <div key={p.id} className="border rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{p.question}</div>
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
          ))}
        </div>
      </section>
    </div>
  )
}