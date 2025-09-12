export type Option = {
  id: string
  label: string
  count: number
}

export type PollStatus = 'draft' | 'live' | 'closed'

export type Poll = {
  id: string
  joinCode: string
  question: string
  options: Option[]
  status: PollStatus
}