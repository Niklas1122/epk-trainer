import type { GroupId, Task } from '../../types'
import { E_TASKS } from './e-ereignisse'
import { F_TASKS } from './f-funktionen'
import { K_TASKS } from './k-konnektoren'
import { M_TASKS } from './m-modell'
import { P_TASKS } from './p-prozessschnittstellen'

// One file per rule group, in the order of the rule catalog.
export const TASKS: Task[] = [...E_TASKS, ...F_TASKS, ...K_TASKS, ...M_TASKS, ...P_TASKS]

export const tasksOf = (group: GroupId) => TASKS.filter((t) => t.group === group)
