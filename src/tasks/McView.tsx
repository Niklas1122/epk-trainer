import type { McTask } from '../types'
import { Option } from './Option'
import type { ViewProps } from './ViewProps'

export function McView({ task, answer, onChange, revealed }: ViewProps<McTask>) {
  const chosen = answer.mc ?? []
  const toggle = (i: number) => {
    if (!task.multi) return onChange({ mc: [i] })
    onChange({ mc: chosen.includes(i) ? chosen.filter((c) => c !== i) : [...chosen, i] })
  }
  return (
    <div className="options">
      {task.options.map((option, i) => (
        <Option
          key={i}
          selected={chosen.includes(i)}
          correct={task.correct.includes(i)}
          revealed={revealed}
          multi={task.multi}
          onClick={() => toggle(i)}
        >
          {option}
        </Option>
      ))}
    </div>
  )
}
