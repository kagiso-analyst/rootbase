'use client'

export type OfflineMutation = {
  id: string
  createdAt: string
  table: string
  operation: 'insert' | 'update' | 'delete'
  payload: Record<string, unknown>
}

const STORAGE_KEY = 'rootbase-offline-mutations'
const QUEUE_EVENT = 'rootbase-offline-queue-changed'

function readQueue(): OfflineMutation[] {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    if (!value) return []
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed as OfflineMutation[] : []
  } catch {
    return []
  }
}

function writeQueue(queue: OfflineMutation[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  window.dispatchEvent(new CustomEvent(QUEUE_EVENT))
}

export function getPendingMutationCount() {
  return readQueue().length
}

export function subscribeToQueueChanges(listener: () => void) {
  window.addEventListener(QUEUE_EVENT, listener)
  return () => window.removeEventListener(QUEUE_EVENT, listener)
}

export function enqueueMutation(mutation: Omit<OfflineMutation, 'id' | 'createdAt'>) {
  const queuedMutation: OfflineMutation = {
    ...mutation,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  writeQueue([...readQueue(), queuedMutation])
  return queuedMutation
}

export async function drainOfflineMutations(
  executor: (mutation: OfflineMutation) => Promise<void>,
) {
  const queue = readQueue()
  const remaining: OfflineMutation[] = []

  for (const mutation of queue) {
    try {
      await executor(mutation)
    } catch {
      remaining.push(mutation)
    }
  }

  writeQueue(remaining)
  return { synced: queue.length - remaining.length, remaining: remaining.length }
}