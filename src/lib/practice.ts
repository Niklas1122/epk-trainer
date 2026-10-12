import { RULES } from '../data/rules'
import { TASKS } from '../data/tasks'
import type { Rule, Task } from '../types'
import type { Progress } from './progress'

// What the learner should practise next, derived from the saved results.

export const PRACTICE_SIZE = 10

const DAY = 24 * 60 * 60 * 1000

export const tasksOfRule = (ruleId: string) => TASKS.filter((t) => t.rules.includes(ruleId))

/** `weak`: a task of the rule was last solved wrong. `done`: all of them were last solved right. */
export type RuleStatus = 'open' | 'started' | 'weak' | 'done'

export interface RuleProgress {
  rule: Rule
  total: number
  right: number
  wrong: number
  status: RuleStatus
}

export function ruleProgress(progress: Progress): RuleProgress[] {
  return RULES.map((rule) => {
    const tasks = tasksOfRule(rule.id)
    const right = tasks.filter((t) => progress.solved[t.id] === true).length
    const wrong = tasks.filter((t) => progress.solved[t.id] === false).length
    const status: RuleStatus =
      wrong > 0 ? 'weak' : right === 0 ? 'open' : right === tasks.length ? 'done' : 'started'
    return { rule, total: tasks.length, right, wrong, status }
  })
}

/**
 * How badly a task needs practice; higher comes first. Tasks last solved wrong
 * rank above tasks never tried, and those above tasks last solved right. Among
 * the latter, a high share of wrong attempts and a long break count.
 */
export function urgency(task: Task, progress: Progress, now: number): number {
  const lastResult = progress.solved[task.id]
  if (lastResult === undefined) return 50

  const stat = progress.stats[task.id]
  const attempts = stat ? stat.right + stat.wrong : 1
  const wrongShare = stat ? stat.wrong / attempts : lastResult ? 0 : 1
  const daysAgo = stat ? Math.min(Math.max((now - Date.parse(stat.last)) / DAY, 0), 14) : 14
  return (lastResult ? 0 : 100) + wrongShare * 30 + daysAgo
}

/** The tasks that need practice most, most urgent first. `tasks` should come shuffled, so that ties vary. */
export function mostUrgent(tasks: Task[], progress: Progress, now: number, size = PRACTICE_SIZE): Task[] {
  return tasks
    .map((task) => ({ task, score: urgency(task, progress, now) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, size)
    .map((entry) => entry.task)
}
