import { GROUPS } from '../data/rules'
import { TASKS, tasksOf } from '../data/tasks'
import type { Task } from '../types'

export const TEST_TASKS_PER_GROUP = 3

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Shuffles the answer options so that positions cannot be memorised. */
export function prepare(task: Task): Task {
  if (task.type === 'mc') {
    const order = shuffle(task.options.map((_, i) => i))
    return {
      ...task,
      options: order.map((i) => task.options[i]),
      correct: task.correct.map((c) => order.indexOf(c)),
    }
  }
  if (task.type === 'pick') {
    const order = shuffle(task.choices.map((_, i) => i))
    return { ...task, choices: order.map((i) => task.choices[i]), correct: order.indexOf(task.correct) }
  }
  return task
}

export const learnQueue = (ids: string[]) => TASKS.filter((t) => ids.includes(t.id)).map(prepare)

/** A random test with the same number of tasks from every rule group. */
export const testQueue = () =>
  shuffle(GROUPS.flatMap((g) => shuffle(tasksOf(g.id)).slice(0, TEST_TASKS_PER_GROUP))).map(prepare)
