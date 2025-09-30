type Listener = (payload?: any) => void

const channels = new Map<string, Set<Listener>>()

export function subscribe(channel: string, cb: Listener): () => void {
  let set = channels.get(channel)
  if (!set) {
    set = new Set()
    channels.set(channel, set)
  }
  set.add(cb)
  return () => {
    set!.delete(cb)
    if (set!.size === 0) channels.delete(channel)
  }
}

export function publish(channel: string, payload?: any) {
  const set = channels.get(channel)
  if (!set) return
  for (const cb of set) cb(payload)
}