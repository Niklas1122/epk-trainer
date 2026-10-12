import { describe, expect, it } from 'vitest'
import { RULES } from '../data/rules'
import { TASKS } from '../data/tasks'
import { mostUrgent, ruleProgress, tasksOfRule, urgency } from './practice'
import type { Progress } from './progress'

const NOW = Date.parse('2026-10-12T12:00:00Z')
const daysAgo = (days: number) => new Date(NOW - days * 24 * 60 * 60 * 1000).toISOString()

const progress = (entries: Record<string, { right: number; wrong: number; ok: boolean; days?: number }>): Progress => ({
  solved: Object.fromEntries(Object.entries(entries).map(([id, e]) => [id, e.ok])),
  stats: Object.fromEntries(
    Object.entries(entries).map(([id, e]) => [id, { right: e.right, wrong: e.wrong, last: daysAgo(e.days ?? 0) }]),
  ),
  tests: [],
})

const [first, second, third] = TASKS

describe('urgency', () => {
  it('stellt zuletzt falsch gelöste vor neue und neue vor richtig gelöste Aufgaben', () => {
    const p = progress({
      [first.id]: { right: 3, wrong: 1, ok: false },
      [third.id]: { right: 1, wrong: 5, ok: true, days: 60 },
    })
    expect(urgency(first, p, NOW)).toBeGreaterThan(urgency(second, p, NOW))
    expect(urgency(second, p, NOW)).toBeGreaterThan(urgency(third, p, NOW))
  })

  it('zieht unter den richtig gelösten die länger zurückliegende und öfter verfehlte vor', () => {
    const p = progress({
      [first.id]: { right: 1, wrong: 0, ok: true, days: 0 },
      [second.id]: { right: 1, wrong: 0, ok: true, days: 7 },
      [third.id]: { right: 1, wrong: 2, ok: true, days: 0 },
    })
    expect(urgency(second, p, NOW)).toBeGreaterThan(urgency(first, p, NOW))
    expect(urgency(third, p, NOW)).toBeGreaterThan(urgency(first, p, NOW))
  })

  it('kommt mit Ergebnissen ohne Statistik zurecht', () => {
    const old: Progress = { solved: { [first.id]: false, [second.id]: true }, stats: {}, tests: [] }
    expect(urgency(first, old, NOW)).toBeGreaterThan(urgency(third, old, NOW))
    expect(urgency(third, old, NOW)).toBeGreaterThan(urgency(second, old, NOW))
  })
})

describe('mostUrgent', () => {
  it('liefert die verlangte Anzahl und beginnt mit den falsch gelösten Aufgaben', () => {
    const wrong = TASKS.slice(20, 23)
    const p = progress(Object.fromEntries(wrong.map((t) => [t.id, { right: 0, wrong: 1, ok: false }])))
    const queue = mostUrgent(TASKS, p, NOW, 10)
    expect(queue).toHaveLength(10)
    expect(queue.slice(0, 3).map((t) => t.id).sort()).toEqual(wrong.map((t) => t.id).sort())
  })

  it('lässt richtig gelöste Aufgaben weg, solange es genug andere gibt', () => {
    const solved = TASKS.slice(0, 30)
    const p = progress(Object.fromEntries(solved.map((t) => [t.id, { right: 1, wrong: 0, ok: true, days: 30 }])))
    const queue = mostUrgent(TASKS, p, NOW, 10)
    expect(queue.filter((t) => solved.includes(t))).toEqual([])
  })
})

describe('ruleProgress', () => {
  const statusOf = (p: Progress, ruleId: string) => ruleProgress(p).find((r) => r.rule.id === ruleId)!

  it('nennt jede Regel mit ihren Aufgaben', () => {
    const all = ruleProgress({ solved: {}, stats: {}, tests: [] })
    expect(all.map((r) => r.rule.id)).toEqual(RULES.map((r) => r.id))
    for (const r of all) {
      expect(r.total).toBeGreaterThan(0)
      expect(r.status).toBe('open')
    }
  })

  it('unterscheidet begonnen, sitzt und wiederholen', () => {
    const tasks = tasksOfRule('E1')
    const right = (list: typeof tasks) => Object.fromEntries(list.map((t) => [t.id, { right: 1, wrong: 0, ok: true }]))

    expect(statusOf(progress(right(tasks.slice(0, 1))), 'E1').status).toBe('started')
    expect(statusOf(progress(right(tasks)), 'E1')).toMatchObject({ status: 'done', right: tasks.length, wrong: 0 })
    const oneWrong = progress({ ...right(tasks), [tasks[0].id]: { right: 1, wrong: 1, ok: false } })
    expect(statusOf(oneWrong, 'E1')).toMatchObject({ status: 'weak', wrong: 1 })
  })
})
