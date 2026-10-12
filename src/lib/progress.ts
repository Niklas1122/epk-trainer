import { useSyncExternalStore } from 'react'

const KEY = 'epk-trainer:v1'

export interface TestResult {
  date: string
  score: number
  total: number
}

export interface Progress {
  /** Last result per task id. */
  solved: Record<string, boolean>
  tests: TestResult[]
}

const EMPTY: Progress = { solved: {}, tests: [] }

let cache: Progress | null = null
const listeners = new Set<() => void>()

// localStorage can be unavailable (private mode, blocked site data); the app
// then simply runs without saved progress.
function read(): Progress {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    cache = raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY
  } catch {
    cache = EMPTY
  }
  return cache!
}

function write(next: Progress) {
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // keep the in-memory copy
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useProgress = () => useSyncExternalStore(subscribe, read)

export function saveResults(results: Record<string, boolean>) {
  const p = read()
  write({ ...p, solved: { ...p.solved, ...results } })
}

export function saveTest(score: number, total: number) {
  const p = read()
  write({ ...p, tests: [...p.tests, { date: new Date().toISOString(), score, total }] })
}

export function resetProgress() {
  write(EMPTY)
}
