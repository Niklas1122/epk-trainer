import { FillView } from './FillView'
import { McView } from './McView'
import { ModelView } from './ModelView'
import { PickView } from './PickView'
import { RuleView } from './RuleView'
import { SpotView } from './SpotView'
import { TfView } from './TfView'
import type { ViewProps } from './ViewProps'

/** Shows a task with the view of its type. */
export function TaskView(props: ViewProps) {
  const { task } = props
  switch (task.type) {
    case 'mc':
      return <McView {...props} task={task} />
    case 'tf':
      return <TfView {...props} task={task} />
    case 'rule':
      return <RuleView {...props} task={task} />
    case 'spot':
      return <SpotView {...props} task={task} />
    case 'fill':
      return <FillView {...props} task={task} />
    case 'pick':
      return <PickView {...props} task={task} />
    case 'model':
    case 'repair':
      return <ModelView {...props} task={task} />
  }
}
