import { sameFlow } from '../epk/compare'
import { isConnector } from '../epk/geometry'
import { validate } from '../epk/validate'
import type { Answer, Epk, EpkNode, ModelTask, Task } from '../types'
import { NODE_LABEL, choiceName } from './labels'

const slotIds = (task: Extract<Task, { type: 'fill' }>) => Object.keys(task.solution)

/** The labelled elements a model task hands to the learner. Connectors come on top. */
export function offeredNodes(task: ModelTask): EpkNode[] {
  const byId = new Map<string, EpkNode>()
  for (const n of [...task.solution.nodes, ...(task.start?.nodes ?? []), ...(task.distractors ?? [])]) {
    if (!isConnector(n.type)) byId.set(n.id, n)
  }
  return [...byId.values()]
}

export interface ModelReview {
  /** Elements of the solution that are not in the model. */
  missing: EpkNode[]
  /** Elements in the model that the solution does not contain. */
  surplus: EpkNode[]
  /** Ids of the rules the model breaks. */
  violations: string[]
  /** Whether the model describes the same process as the solution. */
  sameFlow: boolean
  ok: boolean
}

export function reviewModel(task: ModelTask, model: Epk): ModelReview {
  const labelled = (epk: Epk) => epk.nodes.filter((n) => !isConnector(n.type))
  const has = (epk: Epk, id: string) => epk.nodes.some((n) => n.id === id)
  const missing = labelled(task.solution).filter((n) => !has(model, n.id))
  const surplus = labelled(model).filter((n) => !has(task.solution, n.id))
  const violations = validate(model)
  const same = sameFlow(model, task.solution)
  return {
    missing,
    surplus,
    violations,
    sameFlow: same,
    ok: missing.length === 0 && surplus.length === 0 && violations.length === 0 && same,
  }
}

export function isAnswered(task: Task, a: Answer): boolean {
  switch (task.type) {
    case 'mc':
      return (a.mc?.length ?? 0) > 0
    case 'tf':
      return a.tf !== undefined
    case 'rule':
      return a.rule !== undefined
    case 'spot':
      return a.spot !== undefined
    case 'fill':
      return slotIds(task).every((id) => a.fill?.[id])
    case 'pick':
      return a.pick !== undefined
    case 'model':
    case 'repair':
      return a.model !== undefined
  }
}

export function isCorrect(task: Task, a: Answer): boolean {
  switch (task.type) {
    case 'mc': {
      const chosen = [...(a.mc ?? [])].sort()
      const wanted = [...task.correct].sort()
      return chosen.length === wanted.length && chosen.every((v, i) => v === wanted[i])
    }
    case 'tf':
      return a.tf === (task.violates.length === 0)
    case 'rule':
      return a.rule === task.correct
    case 'spot':
      return a.spot !== undefined && task.targets.includes(a.spot)
    case 'fill':
      return slotIds(task).every((id) => {
        const chosen = a.fill?.[id]
        return chosen !== undefined && task.solution[id].includes(chosen)
      })
    case 'pick':
      return a.pick === task.correct
    case 'model':
    case 'repair':
      return a.model !== undefined && reviewModel(task, a.model).ok
  }
}

/** One sentence that names the right answer, shown after a wrong attempt. */
export function solutionText(task: Task): string {
  switch (task.type) {
    case 'mc':
      return `Richtig ist: ${task.correct.map((i) => `„${task.options[i]}“`).join(' und ')}`
    case 'tf':
      return task.violates.length === 0 ? 'Die EPK ist regelkonform.' : 'Die EPK ist nicht regelkonform.'
    case 'rule':
      return `Verletzt wird Regel ${task.correct}.`
    case 'spot':
      return 'Das fehlerhafte Element ist im Diagramm markiert.'
    case 'fill':
      return `In die Lücke gehört: ${slotIds(task)
        .map((id) => NODE_LABEL[task.solution[id][0]])
        .join(', ')}.`
    case 'pick':
      return `Richtig ist ${choiceName(task.correct)}.`
    case 'model':
    case 'repair':
      return 'Vergleiche dein Modell mit der Musterlösung.'
  }
}
