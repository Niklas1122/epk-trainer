import { EpkDiagram } from '../epk/EpkDiagram'
import type { TfTask } from '../types'
import { Option } from './Option'
import type { ViewProps } from './ViewProps'

export function TfView({ task, answer, onChange, revealed }: ViewProps<TfTask>) {
  const truth = task.violates.length === 0
  return (
    <>
      <EpkDiagram epk={task.epk} />
      <div className="options options-row">
        {[true, false].map((value) => (
          <Option
            key={String(value)}
            selected={answer.tf === value}
            correct={truth === value}
            revealed={revealed}
            onClick={() => onChange({ tf: value })}
          >
            {value ? 'Regelkonform' : 'Nicht regelkonform'}
          </Option>
        ))}
      </div>
    </>
  )
}
