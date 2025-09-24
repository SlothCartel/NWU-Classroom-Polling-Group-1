// src/pages/StatsPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPollStats, getPollById } from '@/lib/api'
import type { Poll } from '@/lib/types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts'
import { setRole } from '@/lib/auth' // ensure lecturer role before going back

type QStat = {
  qIndex: number
  text: string
  correct: number
  incorrect: number
  notAnswered?: number
}

export default function StatsPage() {
  // ✅ Support either /stats/:id or /stats/:pollId
  const params = useParams<{ id?: string; pollId?: string }>()
  const statId = params.pollId ?? params.id ?? ''

  const navigate = useNavigate()

  const [poll, setPoll] = useState<Poll | null>(null)
  const [attendees, setAttendees] = useState<string[]>([])
  const [perQuestion, setPerQuestion] = useState<QStat[]>([])
  const [openAtt, setOpenAtt] = useState(false)

  useEffect(() => {
    let cancel = false

    async function loadOnce() {
      if (!statId) return
      try {
        const p = await getPollById(statId)
        if (!cancel) setPoll(p)
      } catch {
        // ignore
      }
    }

    async function tick() {
      if (!statId) return
      try {
        const s = await getPollStats(statId)
        if (cancel) return
        setAttendees(s.attendees)
        setPerQuestion(s.perQuestion as QStat[])
      } finally {
        if (!cancel) setTimeout(tick, 2000) // lightweight polling
      }
    }

    loadOnce()
    tick()
    return () => { cancel = true }
  }, [statId])

  const handleBack = () => {
    setRole('lecturer') // ✅ make sure the guard allows /dashboard
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-purple-700 text-purple-900">
      <div className="mx-auto max-w-5xl p-6">
        <div className="bg-white/95 rounded-3xl shadow-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{poll?.title ?? 'Poll stats'}</h1>
              <p className="text-sm text-gray-500">Live results (updates every ~2s)</p>
            </div>
            <button className="btn-secondary" onClick={handleBack}>Back to dashboard</button>
          </div>

          {/* Attendance */}
          <div className="mt-6">
            <button
              className="btn-primary"
              onClick={() => setOpenAtt(v => !v)}
              aria-expanded={openAtt}
            >
              Attendance ({attendees.length})
            </button>
            {openAtt && (
              <div className="mt-3 border rounded-xl p-3 max-h-56 overflow-auto">
                {attendees.length === 0 ? (
                  <div className="text-gray-500 text-sm">No students yet.</div>
                ) : (
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {attendees.map(s => (
                      <li key={s} className="font-mono bg-purple-50 rounded-lg px-3 py-2">{s}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Charts – one per question */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-3">Per-question correctness</h2>

            <div className="grid md:grid-cols-2 gap-5">
              {perQuestion.map(q => {
                const data = [{
                  name: 'Responses',
                  Correct: q.correct,
                  Incorrect: q.incorrect,
                  'Not answered': q.notAnswered ?? 0,
                }]
                return (
                  <div key={q.qIndex} className="bg-white rounded-2xl border p-4">
                    <div className="text-sm font-semibold mb-2">Q{q.qIndex + 1}. {q.text}</div>
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="Correct" fill="#16a34a" />
                          <Bar dataKey="Incorrect" fill="#dc2626" />
                          <Bar dataKey="Not answered" fill="#9ca3af" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button className="btn-primary" onClick={handleBack}>Back</button>
          </div>
        </div>
      </div>
    </div>
  )
}
