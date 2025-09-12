import { useEffect, useState } from 'react'
import { getPollByCode, vote } from '../lib/api'
import type { Poll } from '../lib/types'
import { subscribe } from '../lib/socket'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

export default function JoinPage() {
  const [code, setCode] = useState('')
  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justVoted, setJustVoted] = useState(false)

  useEffect(() => {
    if (!poll?.id) return
    const unsub = subscribe(`poll:${poll.id}`, async () => {
      const latest = await getPollByCode(poll.joinCode)
      if (latest) setPoll(latest)
    })
    return () => unsub()
  }, [poll?.id, poll?.joinCode])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const found = await getPollByCode(code.trim())
    setLoading(false)
    if (!found) {
      setError('No live poll with that code.')
      return
    }
    setPoll(found)
  }

  async function cast(optionId: string) {
    if (!poll || justVoted) return
    setJustVoted(true)
    await vote(poll.id, optionId)
    const latest = await getPollByCode(poll.joinCode)
    if (latest) setPoll(latest)
    setTimeout(() => setJustVoted(false), 800)
  }

  if (!poll) {
    return (
      <div className="card p-6 max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-3">Join a poll</h2>
        <form onSubmit={handleJoin} className="space-y-3">
          <label className="label">Enter join code</label>
          <input
            className="input"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. ABC123"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Joining…' : 'Join'}
          </button>
        </form>
      </div>
    )
  }

  const data = poll.options.map((o) => ({ name: o.label, count: o.count }))

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card p-6">
        <h3 className="font-semibold text-lg">{poll.question}</h3>
        <p className="text-sm text-gray-500 mb-3">
          Code: <strong>{poll.joinCode}</strong>
        </p>
        <div className="space-y-2">
          {poll.options.map((o) => (
            <button
              key={o.id}
              onClick={() => cast(o.id)}
              className="btn-secondary w-full"
              disabled={justVoted}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold mb-3">Live results</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}