import { useSyncExternalStore } from 'react'

const KEY = 'epk-trainer:v1'

export interface TestResult {
  date: string
  score: number
  total: number
}

export interface TaskStat {
  right: number
  wrong: number
  /** ISO date of the last attempt. */
  last: string
}

export interface Progress {
  /** Last result per task id. */
  solved: Record<string, boolean>
  /** Attempts per task id. Results saved by an older version have no entry here. */
  stats: Record<string, TaskStat>
  tests: TestResult[]
}

export const EMPTY: Progress = { solved: {}, stats: {}, tests: [] }

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

/** The progress as it is right now, for code outside of React rendering. */
export const readProgress = read

export function saveResults(results: Record<string, boolean>) {
  const p = read()
  const last = new Date().toISOString()
  const stats = { ...p.stats }
  for (const [id, ok] of Object.entries(results)) {
    // A result without statistics was saved by an older version and counts as one attempt.
    const legacy = p.solved[id]
    const before = stats[id] ?? { right: legacy === true ? 1 : 0, wrong: legacy === false ? 1 : 0 }
    stats[id] = { right: before.right + (ok ? 1 : 0), wrong: before.wrong + (ok ? 0 : 1), last }
  }
  write({ ...p, solved: { ...p.solved, ...results }, stats })
}

export function saveTest(score: number, total: number) {
  const p = read()
  write({ ...p, tests: [...p.tests, { date: new Date().toISOString(), score, total }] })
}

export function resetProgress() {
  write(EMPTY)
}
