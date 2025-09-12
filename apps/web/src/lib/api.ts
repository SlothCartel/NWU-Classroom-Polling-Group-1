import type { Poll } from "./types"
import { publish } from "./socket"

// --- In-memory demo DB (replace with real backend later) ---
const db: Record<string, Poll> = {}

function uid(prefix = "") {
  return (
    prefix +
    Math.random().toString(36).slice(2, 7) +
    Math.random().toString(36).slice(2, 4)
  ).toUpperCase()
}

function clone<T>(x: T): T {
  // tiny deep clone for demo
  return typeof structuredClone === "function"
    ? structuredClone(x as any)
    : JSON.parse(JSON.stringify(x))
}

function seedOnce() {
  if (Object.keys(db).length) return
  const p: Poll = {
    id: "P1",
    joinCode: "ABC123",
    question: "Which NWU campus are you on today?",
    status: "live",
    options: [
      { id: "O1", label: "Mahikeng", count: 0 },
      { id: "O2", label: "Potchefstroom", count: 0 },
      { id: "O3", label: "Vanderbijlpark", count: 0 }
    ]
  }
  db[p.id] = clone(p)
}
seedOnce()

// ---------------- Public API used by pages ----------------

export async function listPolls(): Promise<Poll[]> {
  return Object.values(db).map(clone)
}

export async function createPoll(question: string, labels: string[]): Promise<Poll> {
  const id = uid("P")
  const joinCode = uid("").slice(0, 6)
  const options = labels
    .filter((s) => s.trim().length > 0)
    .map((label) => ({ id: uid("O"), label, count: 0 }))

  const poll: Poll = {
    id,
    joinCode,
    question,
    status: "draft",
    options
  }
  db[id] = poll
  return clone(poll)
}

export async function startPoll(id: string): Promise<void> {
  const p = db[id]
  if (!p) return
  p.status = "live"
  publish(`poll:${id}`, { pollId: id })
}

export async function closePoll(id: string): Promise<void> {
  const p = db[id]
  if (!p) return
  p.status = "closed"
  publish(`poll:${id}`, { pollId: id })
}

export async function getPollByCode(code: string): Promise<Poll | null> {
  const byCode = Object.values(db).find(
    (p) => p.joinCode.toUpperCase() === code.toUpperCase() && p.status === "live"
  )
  return byCode ? clone(byCode) : null
}

export async function vote(pollId: string, optionId: string): Promise<void> {
  const p = db[pollId]
  if (!p || p.status !== "live") return
  const opt = p.options.find((o) => o.id === optionId)
  if (!opt) return
  opt.count += 1
  publish(`poll:${pollId}`, { pollId })
}

export async function resetDemo(): Promise<void> {
  for (const k of Object.keys(db)) delete db[k]
  seedOnce()
}
