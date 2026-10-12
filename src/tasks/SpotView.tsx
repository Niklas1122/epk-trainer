import { EpkDiagram } from '../epk/EpkDiagram'
import type { Mark } from '../epk/EpkDiagram'
import type { SpotTask } from '../types'
import type { ViewProps } from './ViewProps'

export function SpotView({ task, answer, onChange, revealed }: ViewProps<SpotTask>) {
  const marks: Record<string, Mark> = {}
  if (revealed) {
    const hit = answer.spot !== undefined && task.targets.includes(answer.spot)
    if (answer.spot !== undefined) marks[answer.spot] = hit ? 'correct' : 'wrong'
    if (!hit) marks[task.targets[0]] = 'hint'
  }
  return (
    <EpkDiagram
      epk={task.epk}
      selectable={revealed ? 'none' : 'all'}
      selected={answer.spot ?? null}
      onSelect={(id) => onChange({ spot: id })}
      marks={marks}
    />
  )
}
