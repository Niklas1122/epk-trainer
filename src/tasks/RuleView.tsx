import { RULE_BY_ID } from '../data/rules'
import { EpkDiagram } from '../epk/EpkDiagram'
import type { RuleTask } from '../types'
import { Option } from './Option'
import type { ViewProps } from './ViewProps'

export function RuleView({ task, answer, onChange, revealed }: ViewProps<RuleTask>) {
  return (
    <>
      <EpkDiagram epk={task.epk} />
      <div className="options options-grid">
        {task.options.map((id) => (
          <Option
            key={id}
            selected={answer.rule === id}
            correct={task.correct === id}
            revealed={revealed}
            onClick={() => onChange({ rule: id })}
          >
            <strong>{id}</strong> {RULE_BY_ID[id].title}
          </Option>
        ))}
      </div>
    </>
  )
}
