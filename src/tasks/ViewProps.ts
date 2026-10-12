import type { Answer, Task } from '../types'

export interface ViewProps<T extends Task = Task> {
  task: T
  answer: Answer
  onChange: (answer: Answer) => void
  /** Shows the solution and locks the inputs. */
  revealed: boolean
}
