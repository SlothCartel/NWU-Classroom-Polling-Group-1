// src/lib/api.ts  — MOCK implementation (localStorage)
// When you add a backend later, swap these with real fetch calls.

import type { Poll, QuizQuestion, StudentPoll } from './types'

/* -------------------------------------------
   Helpers
--------------------------------------------*/
const LS_KEY = 'mock_polls_v1'

function load(): Poll[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as Poll[]) : []
  } catch {
    return []
  }
}

function save(polls: Poll[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(polls))
}

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function genJoinCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

/* -------------------------------------------
   Lecturer/Admin endpoints (MOCK)
--------------------------------------------*/
export async function listPolls(): Promise<Poll[]> {
  return load()
}

export async function createPoll(payload: {
  title: string
  questions: QuizQuestion[]
  timerSeconds: number
  securityCode?: string
}): Promise<Poll> {
  const polls = load()
  const poll: Poll = {
    id: genId(),
    joinCode: genJoinCode(),
    title: payload.title,
    status: 'draft',
    questions: payload.questions,
    timerSeconds: payload.timerSeconds,
    securityCode: payload.securityCode,
  }
  polls.unshift(poll)
  save(polls)
  return poll
}

export async function updatePoll(
  id: string,
  patch: Partial<Pick<Poll, 'title' | 'questions' | 'timerSeconds' | 'securityCode' | 'status'>>
): Promise<void> {
  const polls = load()
  const i = polls.findIndex(p => p.id === id)
  if (i >= 0) {
    polls[i] = { ...polls[i], ...patch }
    save(polls)
  }
}

export async function deletePoll(id: string): Promise<void> {
  const polls = load().filter(p => p.id !== id)
  save(polls)
}

export async function openPoll(id: string): Promise<void> {
  await updatePoll(id, { status: 'open' })
}

export async function startPoll(id: string): Promise<void> {
  await updatePoll(id, { status: 'live' })
}

export async function closePoll(id: string): Promise<void> {
  await updatePoll(id, { status: 'closed' })
}

/* -------------------------------------------
   Student endpoints (MOCK)
--------------------------------------------*/
export async function getPollByCode(joinCode: string): Promise<StudentPoll> {
  const polls = load()
  const p = polls.find(x => x.joinCode.toUpperCase() === joinCode.toUpperCase())
  if (!p) throw new Error('Poll not found')
  if (!(p.status === 'open' || p.status === 'live')) throw new Error('Poll is not accepting joins')
  return {
    id: p.id,
    joinCode: p.joinCode,
    title: p.title,
    status: p.status,
    timerSeconds: p.timerSeconds,
    questions: p.questions.map(q => ({ text: q.text, options: q.options })),
  }
}

export async function submitAnswers(params: {
  pollId: string
  answers: number[]
  studentNumber: string
  securityCode?: string
}): Promise<void> {
  const polls = load()
  const p = polls.find(x => x.id === params.pollId)
  if (!p) throw new Error('Poll not found')
  if (p.securityCode && p.securityCode !== params.securityCode) throw new Error('Invalid security code')
  if (p.status !== 'live') throw new Error('Poll is not live')
  return
}